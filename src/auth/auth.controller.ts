import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './types/authenticated-user.type';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(dto);
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.authService.issueTokenPair(user);

    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { user, accessToken, refreshToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateCredentials(dto);
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.authService.issueTokenPair(user);

    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { user, accessToken, refreshToken };
  }

  // Web clients (browser) present the refresh token via the httpOnly cookie.
  // Native clients (mobile apps have no cookie jar tied to an origin) present it explicitly in the body.
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const presentedToken = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
    if (!presentedToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { accessToken, refreshToken, refreshTokenExpiresAt, user } =
      await this.authService.rotateRefreshToken(presentedToken);

    this.setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
    return { user, accessToken, refreshToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const presentedToken = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE_NAME];
    if (presentedToken) {
      await this.authService.revokeRefreshToken(presentedToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }
}
