package com.erp.shiro.response;

import com.erp.shiro.common.IStatusMessage;
import lombok.Data;

import java.io.Serializable;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.response.ResponseResult]
 * @Description 前端请求响应结果, code:编码,message:描述,obj对象，可以是单个数据对象，数据列表或者PageInfo
 * @Date 2020/3/9 10:52
 */
@Data
@SuppressWarnings("unused")
public class ResponseResult implements Serializable {
    private String code;
    private String message;
    private Object obj;

    public ResponseResult() {
        this.code = IStatusMessage.MANY_LOGINS.getCode();
        this.message = IStatusMessage.MANY_LOGINS.getCode();
    }

    public ResponseResult(IStatusMessage statusMessage) {
        this.code = statusMessage.getCode();
        this.message = statusMessage.getMessage();

    }
}
