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
      SUB_TYPE: {
        TABLE: '5',
        GRID: '6',
      },

      initializeModel() {
        return {
          busy: false,
          pernr: null,
          header: {
            profilePath: 'asset/image/avatar-unknown.svg',
            name: '',
            chief: false,
            baseInfo: [],
          },
          tab: {
            selectedKey: '',
            list: [],
          },
        };
      },

      onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const sPernr = oParameter.pernr || this.getSessionData().Pernr;

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.loadProfile({ oViewModel, sPernr });
      },

      async loadProfile({ oViewModel, sPernr }) {
        let aHeaderRequests = [];
        let aContentRequests = [];

        try {
          const oViewModelData = oViewModel.getData();
          const fCurriedPA = Client.getEntitySet(this.getModel(ServiceNames.PA));
          const mFilters = { Pernr: sPernr, Mobile: 'X' };

          // 1. 상단 프로필, 탭 메뉴
          const [
            aProfileReturnData, //
            aMenuReturnData,
          ] = await Promise.all([
            fCurriedPA('EmpProfileHeaderNew', mFilters), //
            fCurriedPA('EmpProfileMenu', mFilters),
          ]);

          // 상단 프로필 Set
          const aLabelFields = ['Dat02', 'Dat04', 'Dat06'];
          const aTextFields = ['Dat03', 'Dat05', 'Dat07'];
          const { Pturl, Data01, Data08, ...oReturnData } = aProfileReturnData[0];

          _.chain(oViewModelData)
            .set(['header', 'profilePath'], _.isEmpty(Pturl) ? 'asset/image/avatar-unknown.svg' : Pturl)
            .set(['header', 'name'], Data01)
            .set(['header', 'chief'], _.isEqual(Data08, 'X'))
            .set(
              ['header', 'baseInfo'],
              _.chain(oReturnData)
                .pick([...aLabelFields, ...aTextFields])
                .map((v, k) => ({ data: v, labelOrText: _.includes(aTextFields, k) ? 'text' : 'label' }))
                .value()
            )
            .commit();
          //End 상단 프로필 Set

          // 탭 메뉴 Set
          // const aTabMenus = _.chain(aMenuReturnData)
          //   .filter({ Child: '1' })
          //   .map((obj, index) => _.assignIn({ Pressed: index === 0 }, obj))
          //   .value();
          // const aSubMenus = _.filter(aMenuReturnData, (o) => o.Child !== '1');

          // oViewModel.setProperty('/employee/tab/list', aTabMenus);
          // oViewModel.setProperty('/employee/tab/menu', aSubMenus);

          // aTabMenus.forEach((data) => {
          //   this.debug(`Tab ${data.Menu1}`, data);

          //   _.set(oViewModelData, ['employee', 'sub', data.Menuc1], { contents: {} });

          //   aHeaderRequests.push(this.readOdata({ sUrl: '/EmpProfileHeaderTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
          //   aContentRequests.push(this.readOdata({ sUrl: '/EmpProfileContentsTabSet', mFilters: { Menuc: data.Menuc1, ...mFilters } }));
          // });

          // aSubMenus.forEach((data) => {
          //   _.set(oViewModelData, ['employee', 'sub', data.Menuc1, 'contents', data.Menuc2], {
          //     type: data.Child,
          //     rowCount: 1,
          //     selectionMode: _.some(this.CRUD_TABLES, (o) => o.key === data.Menuc2) ? 'MultiToggle' : 'None',
          //     title: data.Menu2,
          //     code: data.Menuc2,
          //     sort: data.Sorts,
          //     header: [],
          //     data: [],
          //   });
          // });
          //End 탭 메뉴 Set

          // 2. Sub 영역 조회[header, contents]
          // const aHeaderReturnData = await Promise.all(aHeaderRequests);
          // const aContentReturnData = await Promise.all(aContentRequests);

          // Header 영역 Set
          // aHeaderReturnData.forEach((headers, index) => {
          //   headers.forEach((o, i) => _.set(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc, 'header', i], o));
          // });
          //End Header 영역 Set

          // Contents 영역 Set
          // aContentReturnData.forEach((content, index) => {
          //   content.forEach((o) => {
          //     let mSubMenu = _.get(oViewModelData, ['employee', 'sub', aTabMenus[index].Menuc1, 'contents', o.Menuc]);

          //     if (mSubMenu.type === this.SUB_TYPE.GRID) {
          //       for (let i = 1; i <= mSubMenu.header.length; i++) {
          //         let sKey = `Value${_.padStart(i, 2, '0')}`;
          //         mSubMenu.data.push(o[sKey]);
          //       }
          //     } else if (mSubMenu.type === this.SUB_TYPE.TABLE) {
          //       mSubMenu.data.push(o);
          //     }

          //     mSubMenu.rowCount = mSubMenu.data.length;
          //   });
          // });
          //End Contents 영역 Set

          // oViewModel.setData(oViewModelData);

          // Sub 영역 UI5 Control 생성
          // this.makeProfileBody();
        } catch (oError) {
          this.debug('Controller > Mobile-Employee-App > loadProfile Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },
    });
  }
);
