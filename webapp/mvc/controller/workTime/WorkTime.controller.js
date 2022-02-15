sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.WorkTime', {
      sDialChartId: 'dialChart',

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onInit() {
        BaseController.prototype.onInit.apply(this, arguments);

        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          MyWork: {},
          search: {
            secondDate: moment().subtract(1, 'month').add(1, 'day').toDate(),
            date: moment().toDate(),
          },
          listInfo: {
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

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mMyWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWorkPayLoad);

          oListModel.setProperty('/MyWork', aMyWork);
          this.buildDialChart(aMyWork);
          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'OtWorkApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async onRefresh() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mMyWork = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWork);

          oListModel.setProperty('/MyWork', aMyWork);
          this.buildDialChart(aMyWork);
          this.onSearch();
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      buildDialChart(aWorkTypeList) {
        FusionCharts.ready(() => {
          new FusionCharts({
            id: this.sDialChartId,
            type: 'angulargauge',
            renderAt: 'chart-dial-container',
            width: '50%',
            height: '175px',
            dataFormat: 'json',
            dataSource: {
              chart: {
                //Cosmetics
                bgColor: 'transparent',
                theme: 'ocean',
                showvalue: '1',
                usePlotGradientColor: '0',
                showPlotBorder: '0',
                showtooltip: '0',
              },
              colorrange: {
                color: [
                  {
                    minvalue: '0',
                    maxvalue: aWorkTypeList.Alwtm,
                    code: '#34649d',
                  },
                  {
                    minvalue: aWorkTypeList.Alwtm,
                    maxvalue: '52',
                    code: '#fdde17',
                  },
                ],
              },
              dials: {
                dial: [
                  {
                    value: aWorkTypeList.Reltm,
                  },
                ],
              },
            },
          }).render();
        });
      },

      // 근무시간
      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      formatWeek(sWeek = '') {
        return `${this.getBundleText('MSG_27001', sWeek)}`;
      },

      onClick() {
        this.getRouter().navTo('workTime-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR17';
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableList = await Client.getEntitySet(oModel, 'OtWorkApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
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

        this.getRouter().navTo('workTime-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('workTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_27001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
