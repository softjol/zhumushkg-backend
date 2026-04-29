import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Каждому запросу назначается refId: из заголовка (если клиент прислал) или новый UUID.
 * Логи и @RefId() в контроллерах получают стабильный идентификатор для трассировки.
 */
@Injectable()
export class RefIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const fromHeader =
      req.get('x-ref-id')?.trim() ||
      req.get('x-request-id')?.trim() ||
      req.get('x-correlation-id')?.trim();
    req.refId = fromHeader || randomUUID();
    res.setHeader('X-Ref-Id', req.refId);
    next();
  }
}
