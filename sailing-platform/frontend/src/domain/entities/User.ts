// src/domain/entities/User.ts
export interface IUser {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

export class User implements IUser {
  constructor(
    public id: string,
    public email: string,
    public username: string,
    public isActive: boolean,
    public createdAt: string
  ) {}

  canLogin(): boolean {
    return this.isActive;
  }
}


