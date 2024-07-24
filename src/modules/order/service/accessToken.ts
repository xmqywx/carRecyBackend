import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import axios from 'axios';

@Provide()
@Scope(ScopeEnum.Singleton) // 确保类的实例是单例
export class AccessToken {
  cachedToken: {
    value: string | null;
    expiry: number | null;
  } = {
    value: null,
    expiry: null,
  };

  async getAccessToken() {
    console.log(this.cachedToken);
    // 检查缓存的token是否存在且未过期
    if (this.cachedToken.value && this.cachedToken.expiry > Date.now()) {
      console.log("-------------------------------token not expire true");
      return this.cachedToken.value;
    }

    console.log("-------------------------------token not expire false");
    // 请求新的token
    const response = await axios.post(
      'https://api.dev.infoagent.com.au/auth/v1/token/oauth',
      {
        grant_type: 'client_credentials',
        // client_id: 'MtDpkDIrb0gej6A2mJWP',
        client_id: 'dvfwCPIFLmrJZKGEF6VP',
        // client_secret: 'b23ed528-7cc1-469e-8df9-9a714e551280',
        client_secret: '79e22f09-bf7e-46bc-ad4c-beda9185bb26',
      }
    );

    const { access_token, expires_in } = response.data;

    // 更新缓存的token和过期时间
    this.cachedToken = {
      value: access_token,
      expiry: Date.now() + expires_in * 1000 - 60000, // 提前10秒刷新token
    };

    console.log(this.cachedToken);

    return access_token;
  }
}