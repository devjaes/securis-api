import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-microsoft'
import type { Profile } from 'passport'
import { CustomConfigService } from '@/core/config/config.service'

interface MicrosoftProfileJson {
  mail?: string
  userPrincipalName?: string
  displayName?: string
  [key: string]: unknown
}

interface MicrosoftProfile extends Profile {
  _json?: MicrosoftProfileJson
}

interface MicrosoftUser {
  microsoftId: string
  email: string
  name: string
  accessToken: string
  refreshToken: string
  profile?: MicrosoftProfileJson
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private configService: CustomConfigService) {
    const clientId = configService.env.MICROSOFT_CLIENT_ID
    const clientSecret = configService.env.MICROSOFT_CLIENT_SECRET
    const redirectUri = configService.env.MICROSOFT_REDIRECT_URI
    const tenantId = configService.env.MICROSOFT_TENANT_ID

    super({
      clientID: clientId,
      clientSecret,
      callbackURL: redirectUri,
      scope: ['user.read', 'email', 'openid', 'profile'],
      tenant: tenantId || 'common',
      authorizationURL: `https://login.microsoftonline.com/${tenantId || 'common'}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenantId || 'common'}/oauth2/v2.0/token`,
      graphApiVersion: 'v1.0',
      apiEntryPoint: 'https://graph.microsoft.com',
    })
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
    done: (error: Error | null, user?: MicrosoftUser) => void,
  ) {
    // Validar que el email sea del dominio @uta.edu.ec
    const email =
      profile.emails?.[0]?.value ||
      profile._json?.mail ||
      profile._json?.userPrincipalName

    if (!email || typeof email !== 'string') {
      return done(new Error('No email found in Microsoft profile'), undefined)
    }

    // Validar dominio si es single tenant
    const tenantId = this.configService.env.MICROSOFT_TENANT_ID
    if (tenantId && tenantId !== 'common') {
      // Si es single tenant, validar que el email sea @uta.edu.ec
      if (!email.endsWith('@uta.edu.ec')) {
        return done(new Error('Only @uta.edu.ec emails are allowed'), undefined)
      }
    }

    const user: MicrosoftUser = {
      microsoftId: profile.id || '',
      email,
      name:
        profile.displayName ||
        profile._json?.displayName ||
        profile.name?.givenName ||
        'User',
      accessToken,
      refreshToken,
      profile: profile._json,
    }

    return done(null, user)
  }
}
