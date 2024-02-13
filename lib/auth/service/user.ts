import { User } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

export const UserService = {
  getUsers() {
    return JSON.parse(readFileSync("users.json", "utf-8")) as User[];
  },
  findById(userId: string) {},
  findByEmail(email: string) {},
  updateUser(user: User) {},
  // createUser(user: Pick<User, "email" | "password">) {},
  saveUsers(users: User[]) {
    writeFileSync("users.json", JSON.stringify(users));
  },
  // loginUserBasic(user: Pick<User, "email" | "password">) {},
};
