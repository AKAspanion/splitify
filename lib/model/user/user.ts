export class User {
  userId: string;
  userName: string;
  email: string;
  mobileNumber: string;

  constructor(
    userId: string,
    userName: string,
    email: string,
    mobileNumber: string,
  ) {
    this.userId = userId;
    this.userName = userName;
    this.email = email;
    this.mobileNumber = mobileNumber;
  }

  public getUserId() {
    return this.userId;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public getUserName() {
    return this.userName;
  }

  public setUserName(userName: string) {
    this.userName = userName;
  }

  public getEmail() {
    return this.email;
  }

  public setEmail(email: string) {
    this.email = email;
  }

  public getMobileNumber() {
    return this.mobileNumber;
  }

  public setMobileNumber(mobileNumber: string) {
    this.mobileNumber = mobileNumber;
  }
}
