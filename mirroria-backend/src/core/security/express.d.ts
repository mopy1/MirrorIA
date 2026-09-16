import type { JwtPayload } from './jwt-payload.interface.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
