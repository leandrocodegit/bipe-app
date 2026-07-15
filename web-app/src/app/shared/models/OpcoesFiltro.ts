import { HttpParams } from "@angular/common/http";


export function trasnformParams(filtro?: any) {

  if(!filtro) return '';

  const cleanObj = Object.entries(filtro).reduce((acc, [key, value]) => {
    acc[key] = value instanceof Date ? value.toISOString() : value;
    return acc;
  }, {} as any);

  const params = new HttpParams({ fromObject: cleanObj });
  return params.toString();
}
