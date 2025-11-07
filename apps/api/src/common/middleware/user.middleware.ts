import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UserMiddleware implements NestMiddleware {
	constructor(private readonly jwtService: JwtService) {}

	use(req: Request, res: Response, next: NextFunction) {
		const token = req.headers.authorization?.split(" ")[1];
		if (token) {
			try {
				const payload = this.jwtService.verify(token);
				req["user"] = payload;
			} catch (_) {}
		}
		next();
	}
}