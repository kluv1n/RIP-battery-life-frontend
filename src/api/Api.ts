/**
 * Swagger-codegen-style клиент (axios) для доменов «заявка battery_life»
 * и связи «заявка — тип аккумулятора» (battery_life_item).
 * Типы аккумуляторов и /users/* — отдельный fetch/axios в модулях.
 */

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export interface SerializerBatteryLifeJSON {
  id?: number;
  status?: string;
  created_at?: string;
  creator_login?: string;
  moderator_login?: string | null;
  formed_at?: string | null;
  completed_at?: string | null;
  title?: string;
  description?: string;
  total_runtime_hours?: number;
  completed_item_count?: number;
}

export interface SerializerBatteryLifeItemJSON {
  battery_life_id?: number;
  battery_type_id?: number;
  current_ma?: number;
  quantity?: number;
  runtime_hours?: number;
}

export interface SerializerStatusJSON {
  status?: string;
}

export type QueryParamsType = Record<string | number, unknown>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseType;
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    }
    return `${formItem}`;
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: unknown[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = unknown, _E = unknown>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    let reqBody: unknown = body;
    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      reqBody = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      reqBody = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: reqBody,
      url: path,
    });
  };
}

export class Api<SecurityDataType extends unknown = unknown> extends HttpClient<SecurityDataType> {
  /** Позиции заявки (м-м заявка — тип аккумулятора) */
  batteryLifeItemBinding = {
    addBatteryTypeToBatteryLifeDraft: (
      batteryLifeTypeId: number,
      body?: SerializerBatteryLifeItemJSON,
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeJSON, Record<string, string>>({
        path: `/battery_life_item/add/${batteryLifeTypeId}`,
        method: "POST",
        body: body ?? {},
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    updateBatteryLifeItemLine: (
      batteryLifeTypeId: number,
      batteryLifeId: number,
      data: SerializerBatteryLifeItemJSON,
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeItemJSON, Record<string, string>>({
        path: `/battery_life_item/${batteryLifeTypeId}/${batteryLifeId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteBatteryLifeItemLine: (
      batteryLifeTypeId: number,
      batteryLifeId: number,
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeJSON, Record<string, string>>({
        path: `/battery_life_item/${batteryLifeTypeId}/${batteryLifeId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),
  };

  /** Заявка на расчёт времени работы (battery_life) */
  batteryLifeApplication = {
    batteryLifeApplicationCartList: (params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        path: `/battery_life/battery_life-cart`,
        method: "GET",
        format: "json",
        ...params,
      }),

    allBatteryLifeApplicationsList: (
      query?: {
        "from-date"?: string;
        "to-date"?: string;
        status?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeJSON[], Record<string, string>>({
        path: `/battery_life/all-battery_life`,
        method: "GET",
        query: { _: String(Date.now()), ...query },
        secure: true,
        format: "json",
        ...params,
      }),

    batteryLifeApplicationDetail: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, unknown>, Record<string, string>>({
        ...params,
        path: `/battery_life/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        query: { _: String(Date.now()) },
      }),

    editBatteryLifeApplicationUpdate: (
      id: number,
      body: SerializerBatteryLifeJSON,
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeJSON, Record<string, string>>({
        path: `/battery_life/${id}/edit-battery_life`,
        method: "PUT",
        body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    deleteBatteryLifeApplicationDelete: (id: number, params: RequestParams = {}) =>
      this.request<Record<string, string>, Record<string, string>>({
        path: `/battery_life/${id}/delete-battery_life`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    formBatteryLifeApplicationUpdate: (id: number, params: RequestParams = {}) =>
      this.request<SerializerBatteryLifeJSON, Record<string, string>>({
        path: `/battery_life/${id}/form-battery_life`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    finishBatteryLifeApplicationUpdate: (
      id: number,
      status: SerializerStatusJSON,
      params: RequestParams = {},
    ) =>
      this.request<SerializerBatteryLifeJSON, Record<string, string>>({
        path: `/battery_life/${id}/finish-battery_life`,
        method: "PUT",
        body: status,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
