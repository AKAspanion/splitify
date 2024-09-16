import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export declare type ApiCallOptions = AxiosRequestConfig & {
  mock?: boolean;
  mockKey?: string;
  baseURL?: string;
};

/**
 * Do a GET request
 * @category api
 */
export const getCall = async <T>(
  path: string,
  options: ApiCallOptions,
): Promise<AxiosResponse<T>> =>
  getMockFlag(options.mock)
    ? mockCall(options?.mockKey)
    : axios.get(path, {
        signal: options.signal,
        headers: options?.headers,
        baseURL: getBaseURL(options.baseURL),
        timeout: getTimeout(options.timeout),
      });

export const postCall = async <T, B = unknown>(
  path: string,
  body: B,
  options: ApiCallOptions,
): Promise<AxiosResponse<T>> => {
  return getMockFlag(options.mock)
    ? mockCall(options?.mockKey)
    : axios.post(path, body, {
        signal: options.signal,
        headers: options?.headers,
        baseURL: getBaseURL(options.baseURL),
        timeout: getTimeout(options.timeout),
      });
};

export const patchCall = async <T, B = unknown>(
  path: string,
  body: B,
  options: ApiCallOptions,
): Promise<AxiosResponse<T>> => {
  return getMockFlag(options.mock)
    ? mockCall(options?.mockKey)
    : axios.patch(path, body, {
        signal: options.signal,
        headers: options?.headers,
        baseURL: getBaseURL(options.baseURL),
        timeout: getTimeout(options.timeout),
      });
};

export const deleteCall = async <T>(
  path: string,
  options: ApiCallOptions,
): Promise<AxiosResponse<T>> => {
  return getMockFlag(options.mock)
    ? mockCall(options?.mockKey)
    : axios.delete(path, {
        signal: options.signal,
        headers: options?.headers,
        baseURL: getBaseURL(options.baseURL),
        timeout: getTimeout(options.timeout),
      });
};

export const postCallMultipartForm = async <T, B = FormData>(
  path: string,
  formData: B,
  options: ApiCallOptions,
): Promise<T> =>
  getMockFlag(options.mock)
    ? mockCall(options.mockKey)
    : axios.post(path, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: options.signal,
        baseURL: getBaseURL(options.baseURL),
        timeout: getTimeout(options.timeout),
      });

const mockCall = async <T>(mockKey?: string): Promise<T> =>
  new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        resolve(true as T);
      }, 300);
    } catch (error) {
      reject(error);
    }
  });

const getMockFlag = (mockFlag?: boolean) => {
  let flag = false;

  return flag;
};

const getBaseURL = (urlKey?: string) => {
  const baseUrl = "";

  return baseUrl;
};

const getTimeout = (call?: number) => {
  const timeout = 250000;

  const value = call || timeout;

  return value;
};

/**
 * Attaches an Axios Request Interceptor
 * @category api
 */
export const attachRequestInterceptor: AttachRequestInterceptor = (
  onSuccess,
  onFailure,
) => {
  return axios.interceptors.request.use(
    function (config) {
      onSuccess(config);
      return config;
    },
    function (error) {
      onFailure && onFailure(error);
      return Promise.reject(error);
    },
  );
};

/**
 * Attaches an Axios Response Interceptor
 * @category api
 */
export const attachResponseInterceptor: AttachResponseInterceptor = (
  onSuccess,
  onFailure,
) => {
  return axios.interceptors.response.use(
    function (config) {
      onSuccess(config);
      return config;
    },
    function (error) {
      onFailure && onFailure(error);
      return Promise.reject(error);
    },
  );
};

/**
 * Ejects an Axios Request Interceptor
 * @category api
 */
export const ejectRequestInterceptor = (id: number) => {
  return axios.interceptors.request.eject(id);
};

/**
 * Ejects an Axios Response Interceptor
 * @category api
 */
export const ejectResponseInterceptor = (id: number) => {
  return axios.interceptors.response.eject(id);
};

export declare type AttachRequestInterceptor = (
  onSuccess: (config: AxiosRequestConfig) => void,
  onFailure?: (err: any) => void,
) => number;

export declare type AttachResponseInterceptor = (
  onSuccess: (config: AxiosResponse) => void,
  onFailure?: (err: any) => void,
) => number;

export const POST_METHOD_CALLBACK = (
  API_URL: string,
  options: ApiCallOptions,
) => {
  return async (formData: any = null) => {
    try {
      const response = await postCall(API_URL, formData || {}, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
};

export const PATCH_METHOD_CALLBACK = (
  API_URL: string,
  options: ApiCallOptions,
) => {
  return async (formData: any = null) => {
    try {
      const response = await patchCall(API_URL, formData || {}, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
};

export const GET_METHOD_CALLBACK = <T>(
  API_URL: string,
  options: ApiCallOptions,
) => {
  console.log({ API_URL });
  return async (queryParams?: any) => {
    try {
      const response = await getCall<T>(API_URL, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
};
