import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';

interface ApiResponse<T> {
  data: T
  // ...其他属性
}

const InternalAxiosHeaders = new AxiosHeaders();

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.axiosInstance = axios.create(config);

    this.axiosInstance.interceptors.request.use(
      (requestConfig: AxiosRequestConfig): InternalAxiosRequestConfig => this.handleRequest(requestConfig),
      (error: any) => this.handleError(error),
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => this.handleResponse(response),
      (error: any) => this.handleError(error),
    );
  }

  private handleRequest(
    config: AxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    return {
      ...config,
      headers: { ...InternalAxiosHeaders, ...config.headers } as AxiosHeaders &
      Record<string, any>,
    };
  }

  private handleResponse(
    response: AxiosResponse<ApiResponse<any>>,
  ): AxiosResponse<ApiResponse<any>> {
    return response;
  }

  private handleError(error: any) {
    // 错误处理逻辑
    return Promise.reject(error);
  }

  public get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }
  // ...其他方法
}

// 使用示例
const apiClient = new ApiClient({ baseURL: 'https://api.example.com' });

export { apiClient };

// apiClient.get<number[]>('/data').then((responseData) => {
//   console.log(responseData)
// })
