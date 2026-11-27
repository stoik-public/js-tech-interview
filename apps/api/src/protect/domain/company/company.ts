import { Entity } from 'src/core/domain/entity';

export type CompanyProps = {
  name: string;
  createdAt: Date;
};

/** A client of Stoïk Protect, whose security is scored every month. */
export class Company extends Entity<CompanyProps> {
  static create(props: Omit<CompanyProps, 'createdAt'>, now: Date): Company {
    return new Company({ ...props, createdAt: now });
  }

  static hydrate(props: CompanyProps, id: string): Company {
    return new Company(props, id);
  }
}
