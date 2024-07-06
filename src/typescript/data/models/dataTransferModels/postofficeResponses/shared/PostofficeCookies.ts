export type Cookie = 'ARRAffinity' | 'ARRAffinitySameSite' | 'CentralJWTCookie' | 'GCLB';

export type Cookies = { [key in Cookie]: string };

export type PartialCookies = Partial<{
	[key in Cookie]: string;
}>;
