sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    ODataModel,
    ServiceNames
  ) => {
    ('use strict');

    // localhost인 경우 ui5.yaml에 세팅된 proxy server를 경유하여 SAP로 요청이 들어가야하므로 /sap/opu/odata/sap/ 앞에 /proxy를 붙임
    const urlPrefix = (window.location.hostname === 'localhost' ? '/proxy' : '') + '/sap/opu/odata/sap/';

    const ServiceManager = {
      /**
       * static fields
       */
      ...ServiceNames,

      urlPrefix,

      /**
       * 서비스 URL 반환
       * @public
       * @param {string} sServiceNameKey 서비스 이름 key (예 : ServiceNames.COMMON) 또는 서비스 이름 (예 : ZHR_COMMON_SRV)
       * @returns {string} 서비스 URL (예 : /sap/opu/odata/sap/ZHR_COMMON_SRV)
       */
      getServiceUrl(sServiceNameKey = '') {
        const sTrimedServiceNameKey = sServiceNameKey.replace(/^[/\s]+/, ''); // 앞 공백 또는 slash 제거
        const sServiceName = /^ZHR/.test(sTrimedServiceNameKey) ? sTrimedServiceNameKey : this[sTrimedServiceNameKey];
        return `${this.urlPrefix}${sServiceName}`;
      },

      /**
       * ODataModel 객체 생성
       * @public
       * @param {string} sServiceName 서비스 이름 (예 : ServiceNames.COMMON)
       * @param {object} oUIComponent component object, controller에서 this.getOwnerComponent()를 호출하여 참조값을 얻을 수 있음
       * @returns {object} OData service의 sap.ui.model.odata.v2.ODataModel 객체
       */
      getODataModel(sServiceName) {
        const sServiceUrl = this.getServiceUrl(sServiceName);
        return new ODataModel(sServiceUrl, { loadMetadataAsync: true, useBatch: false });
      },

      /**
       * OData 서비스 이름 배열 반환
       * @public
       * @returns {array}
       */
      getServiceNames() {
        return Object.values(ServiceNames);
      },
    };

    return ServiceManager;
  },
  /* bExport= */ true
);
