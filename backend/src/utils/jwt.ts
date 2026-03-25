import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: number;
  email: string;
  role: "USER" | "ADMIN";
}

const secret = process.env.JWT_SECRET || "dev_secret";

export const signToken = (payload: TokenPayload) => {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, secret) as TokenPayload;
};
