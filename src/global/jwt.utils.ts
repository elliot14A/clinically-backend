import { sign, verify, SignOptions } from 'jsonwebtoken';

const publicKey=`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCSnGZ4r/3omoLtqeY38Ta9Sb5Z
ITKGWu8hhhdulWSMwmE/QEZ3O1JuZ9fsFm6WLX7win1gVtRrGmRuHrbpZ3clc+i9
crtq+If+EhHrmtvsyfqTwoXAVefVSdKtOsUOlHF+U7ujBdvjdxqGNRlaYdyExIvr
hcIffF8KS3UDooqjUwIDAQAB
-----END PUBLIC KEY-----`

const privateKey=`-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCSnGZ4r/3omoLtqeY38Ta9Sb5ZITKGWu8hhhdulWSMwmE/QEZ3
O1JuZ9fsFm6WLX7win1gVtRrGmRuHrbpZ3clc+i9crtq+If+EhHrmtvsyfqTwoXA
VefVSdKtOsUOlHF+U7ujBdvjdxqGNRlaYdyExIvrhcIffF8KS3UDooqjUwIDAQAB
AoGABO/tZ30NwOqLJDPHg/TEkiVMmrXKfMnNKcTZPykaxL67BaVFejhuMzeeBt5O
hRItJy6SwE7MQnsWDLtOD5gjY/sfqxdpGo3OMpehYQcZqQSdvKb0/SH9AkwGf0az
GfuFZdSbeJ4lZsm7njWTKn6LPyR4h3cyq7oiKPt9kAyr76kCQQDxwTdTCd6h0Svk
AS1HjajVcYZkNhwZMg3bHPrllfLE1NNAoZJrNyWDhbNER0JykTTTExef6Lk5vlpl
m1BNVlHFAkEAmz/5TBjJmCn1HT/gfPvlRYcqSVuUHdbN7JZ1h12oycSlRjht6HlA
bgZF/CUFhncUH3GkuD9eDB+SXBoDzk3qNwJAC+sprhdbeYDVeB0yvUdXnoZFSOV+
ByP3mOjZ2b3FxTx02cfdbxm96LkLuH8G4J0WDJ3xWTng/97JmB7LG7T4vQJBAJE0
r8Zl9MAWlkTqRtx/ebyjJIECX7HdBDPBsmGOz10QSQk5pErohcOiqHiiY92VqMOU
Nl2CH0O1j94HEwI1y9cCQQCpz3JiajWEuKpCmzmkHuUxMQvKhMH98EWqyVUe9ESY
1j35fkb3Trk9cqYNumo7lXrLWd+epON2+gTyHo6b1Eu6
-----END RSA PRIVATE KEY-----`

export function signJwt(object: Object, options?: SignOptions) {
  return sign(object, privateKey, { ...options, algorithm: 'RS256' });
}

export function verifyJwt(token: string): {
  valid: boolean;
  expired: boolean;
  decoded: any;
} {
  try {
    const decodeJwt = verify(token, publicKey!);
    return {
      valid: true,
      expired: false,
      decoded: decodeJwt,
    };
  } catch (err: any) {
    return {
      valid: false,
      expired: err.message === 'jwt expired',
      decoded: null,
    };
  }
}
