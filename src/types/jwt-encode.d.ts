declare module "jwt-encode" {
  export default function jwtEncode(
    payload: Record<string, any>,
    secret: string
  ): string;
}
