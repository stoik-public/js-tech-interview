import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { fakeApi, ok, type Reply } from '../../../test/fake-api';
import { companyDetail, draftAssessment, report, scale } from '../../../test/protect-fixtures';
import { createQueryClient, pageWrapper } from '../../../test/providers';
import { CompanyPage } from './CompanyPage';

function renderCompanyPage() {
  render(
    <Routes>
      <Route path="/protect/companies/:companyId" element={<CompanyPage />} />
    </Routes>,
    { wrapper: pageWrapper(createQueryClient(), '/protect/companies/company-1') },
  );
  return { user: userEvent.setup() };
}

const scoreCard = () => screen.getByRole('complementary', { name: 'Score' });
const publishButton = () => within(scoreCard()).getByRole('button', { name: 'Publish report' });

describe('a company with a draft assessment', () => {
  it('shows the score of the draft, line by line, and the reports', async () => {
    fakeApi({
      'GET /scoring/scale': () => ok(scale()),
      'GET /protect/companies/company-1': () => ok(companyDetail()),
    });

    renderCompanyPage();

    expect(await screen.findByText('Draft')).toBeDefined();
    expect(within(scoreCard()).getByText('55', { selector: 'p > span' })).toBeDefined();
    expect(within(scoreCard()).getAllByText('−20', { selector: 'dd' })).toHaveLength(2);
    expect(within(scoreCard()).getByText('3, tier up to 5')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Nov 2026: 45, Weak' })).toBeDefined();
  });

  it('re-scores the draft when a signal changes, and cannot be published meanwhile', async () => {
    let release: (reply: Reply) => void = () => {};
    const saving = new Promise<Reply>((done) => (release = done));
    const api = fakeApi({
      'GET /scoring/scale': () => ok(scale()),
      'GET /protect/companies/company-1': () => ok(companyDetail()),
      'PUT /protect/assessments/assessment-1': () => saving,
    });
    const { user } = renderCompanyPage();
    const leaked = await screen.findByRole('textbox', { name: 'Leaked passwords' });

    await user.clear(leaked);
    await user.type(leaked, '0');
    await waitFor(() => expect(publishButton().getAttribute('aria-disabled')).toBe('true'));
    await user.click(publishButton());
    expect(screen.queryByRole('dialog')).toBeNull();

    release(
      ok(draftAssessment({ score: 75, band: 'Good', updatedAt: '2026-11-21T10:00:00.000Z' })),
    );

    await waitFor(() => expect(publishButton().getAttribute('aria-disabled')).toBe('false'));
    expect(within(scoreCard()).getByText('75', { selector: 'p > span' })).toBeDefined();
    expect(api.callsTo('PUT /protect/assessments/assessment-1').at(-1)?.body).toEqual({
      phishingClickRatePct: 18,
      leakedPasswords: 0,
      unhandledAlerts: 2,
    });
  });

  it('does not send a signal out of range, and says why next to the field', async () => {
    const api = fakeApi({
      'GET /scoring/scale': () => ok(scale()),
      'GET /protect/companies/company-1': () => ok(companyDetail()),
    });
    const { user } = renderCompanyPage();
    const rate = await screen.findByRole('textbox', { name: 'Phishing click rate' });

    await user.clear(rate);
    await user.type(rate, '150');
    await user.tab();

    expect(await screen.findByText('Enter a percentage up to 100')).toBeDefined();
    expect(publishButton().getAttribute('aria-disabled')).toBe('true');
    expect(api.callsTo('PUT /protect/assessments/assessment-1')).toHaveLength(0);
  });

  it('is published after confirmation, which turns it into a report', async () => {
    let published = false;
    const api = fakeApi({
      'GET /scoring/scale': () => ok(scale()),
      'GET /protect/companies/company-1': () =>
        ok(
          published
            ? companyDetail({
                draft: null,
                reports: [report({ id: 'assessment-1', score: 55 }), report()],
              })
            : companyDetail(),
        ),
      'POST /protect/assessments/assessment-1/publish': () => {
        published = true;
        return ok(
          draftAssessment({ status: 'published', publishedAt: '2026-11-25T10:00:00.000Z' }),
        );
      },
    });
    const { user } = renderCompanyPage();
    await screen.findByText('Draft');

    await user.click(publishButton());
    const dialog = screen.getByRole('dialog', { name: 'Publish this report?' });
    expect(api.callsTo('POST /protect/assessments/assessment-1/publish')).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Publish report' }));

    expect(await screen.findByText('Report published')).toBeDefined();
    await waitFor(() => expect(screen.queryByText('Draft')).toBeNull());
    expect(screen.getByRole('button', { name: 'Start assessment' })).toBeDefined();
  });
});
