import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TranscriptionLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TranscriptionLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const timestamp = Date.now();

    // Log da requisição
    if (request.file) {
      this.logger.log(
        `📹 ${method} ${url} - Arquivo: ${request.file.originalname} (${(
          request.file.size /
          (1024 * 1024)
        ).toFixed(2)}MB)`,
      );
    } else {
      this.logger.log(`🔄 ${method} ${url}`);
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - timestamp;
          if (response?.success) {
            this.logger.log(
              `✅ ${method} ${url} - Processado em ${duration}ms`,
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - timestamp;
          this.logger.error(
            `❌ ${method} ${url} - Erro após ${duration}ms: ${error.message}`,
          );
        },
      }),
    );
  }
}
