sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/Table',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataUpdateError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/PostcodeDialogHandler',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    CSSGrid,
    Filter,
    FilterOperator,
    JSONModel,
    Table,
    Appno,
    AppUtils,
    Client,
    DateUtils,
    AttachFileAction,
    ComboEntry,
    ODataCreateError,
    ODataDeleteError,
    ODataReadError,
    ODataUpdateError,
    ServiceNames,
    PostcodeDialogHandler,
    Validator,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.employee.mobile.App', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          pernr: null,
          orgtx: null,
          orgeh: null,
          actions: [
            { contents: [{ valueTxt: '2022.01.01' }, { valueTxt: '인재개발팀 / 인사' }, { valueTxt: '조직발령-직무이동' }, { valueTxt: '부장 / 팀장' }] }, //
            { contents: [{ valueTxt: '2022.01.01' }, { valueTxt: '인재개발팀 / 인사' }, { valueTxt: '조직발령-직무이동' }, { valueTxt: '부장 / 팀장' }] },
            { contents: [{ valueTxt: '2022.01.01' }, { valueTxt: '인재개발팀 / 인사' }, { valueTxt: '조직발령-직무이동' }, { valueTxt: '부장 / 팀장' }] },
          ],
          actions2: [
            { contents: [{ valueTxt: '본적' }, { valueTxt: '12345 서울시 성동구 용답동 자동차시장길로 23 예스코' }] }, //
            { contents: [{ valueTxt: '주민등록지' }, { valueTxt: '12345 서울시 성동구 용답동 자동차시장길로 23 예스코' }] },
          ],
          actions3: [
            { contents: [{ valueTxt: '회사메일' }, { valueTxt: 'abc@gmail.com' }] }, //
            { contents: [{ valueTxt: '회사전화번호' }, { valueTxt: '02-0000-0000' }] },
            { contents: [{ valueTxt: '휴대폰' }, { valueTxt: '010-9999-9999' }] },
          ],
          actions4: [
            { contents: [{ valueTxt: '1983.03 ~ 1995.02' }, { valueTxt: '한국대' }, { valueTxt: '입사전' }, { valueTxt: '대학교 학사' }, { valueTxt: '경영학과' }, { valueTxt: '신입' }] }, //
            { contents: [{ valueTxt: '1983.03 ~ 1995.02' }, { valueTxt: '한국고등학교' }, { valueTxt: '입사전' }, { valueTxt: '고등학교 졸업' }, { valueTxt: '' }, { valueTxt: '신입' }] }, //
          ],
          employee: {
            width: '73%',
            busy: true,
            header: {
              profilePath: 'asset/image/avatar-unknown.svg?ssl=1',
              baseInfo: [],
              timeline: null,
            },
            tab: {
              list: [],
            },
            sub: {},
          },
        });
        this.setViewModel(oViewModel);
      },
    });
  }
);
