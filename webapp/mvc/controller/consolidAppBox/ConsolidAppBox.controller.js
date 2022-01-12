sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.consolidAppBox.ConsolidAppBox', {
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      NAVIGATION: {
        1120: { url: 'familyInfo-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 가족변경
        1210: { url: 'certification-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 제증명
        2110: {
          // 근태
          url: 'attendance-detail',
          key: [
            { key: 'appno', value: 'Appno' },
            { key: 'type', value: 'Appty' },
          ],
        },
        2140: { url: 'excavation-detail', key: [{ key: 'appno', value: 'Appno' }] }, // 통합굴착야간
        4110: { url: 'congratulation-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 경조금
        4210: { url: 'studentFunds-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 학자금
        4310: {
          url: 'housingLoan-detail',
          key: [
            { key: 'oDataKey', value: 'Appno' },
            { key: 'lonid', value: 'AppLonid' },
          ],
        }, // 융자 & 용자상환
        4410: { url: 'medical-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 의료비
        4510: { url: 'clubJoin-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 동호회
        // 2140: { url: 'excavation-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 당직변경
        // 2140: { url: 'excavation-detail', key: [{ key: 'oDataKey', value: 'Appno' }] }, // 연장/휴일근무
      },

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          AppType: [],
          parameters: {},
          search: {
            date: dDate,
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1),
          },
          listInfo: {
            isShowProgress: true,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: true,
            isShowComplete: true,
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'TotalApproval2', {
            ZreqForm: oSearch.ZreqForm || '',
            MidE: this.getCurrentMenuId(),
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('consolidTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_19001'));
          oListModel.setProperty('/List', aTableList);

          const aAppList = await Client.getEntitySet(oModel, 'TotalApproval3');

          oListModel.setProperty('/AppType', new ComboEntry({ codeKey: 'ZreqForm', valueKey: 'ZreqForx', aEntries: aAppList }));
          oListModel.setProperty('/search/ZreqForm', 'ALL');

          const dDate = new Date();
          const mPayLoad = {
            Begda: moment(new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1))
              .hours(9)
              .toDate(),
            Endda: moment(dDate).hours(9).toDate(),
          };

          const aMyTotalList = await Client.getEntitySet(oModel, 'TotalApproval1', mPayLoad);

          oListModel.setProperty('/Total', aMyTotalList[0]);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'TotalApproval2', {
            ZreqForm: oSearch.ZreqForm || '',
            MidE: this.getCurrentMenuId(),
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('consolidTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_19001'));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const mNavigationInfo = this.NAVIGATION[oRowData.MidE];
        // let sMenuUrl = `${AppUtils.getAppComponent().getMenuModel().getProperties(`${oRowData.MidE}`).Mnurl}-detail`;

        if (oRowData.ZreqForm === 'HR08') {
          mNavigationInfo.url = 'housingLoan-repay';
        }

        debugger;
        this.getRouter().navTo(
          mNavigationInfo.url,
          _.reduce(mNavigationInfo.key, (acc, cur) => ({ ...acc, [cur.key]: oListModel.getProperty(`${vPath}/${cur.value}`) }), {})
        );
      },

      onPressExcelDownload() {
        const oTable = this.byId('consolidTable');
        const aTableData = this.getViewModel().getProperty('/ZappStatAl');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_19001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
