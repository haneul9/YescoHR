sap.ui.define(
  [
    // prettier 방지용 주석
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.worktimeStatus.WorktimeStatus', {
      sDialChartId: 'barChart',

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          AreaList: [],
          OrgList: [],
          GubunList: [
            { Zcode: '1', Ztext: this.getBundleText('LABEL_32009') }, // 개인별
            { Zcode: '2', Ztext: this.getBundleText('LABEL_32010') }, // 조직별
          ],
          search: {
            Zyymm: moment().format('yyyyMM'),
            Werks: this.getAppointeeProperty('Werks'),
            Orgeh: '',
            Disty: '1',
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
        };
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();

          const [aAreaList, aOrgList] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'PersAreaList'),
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', {
              Pernr: mAppointee.Pernr,
              Werks: mAppointee.Werks,
            }),
          ]);

          oListModel.setProperty('/AreaList', aAreaList);
          oListModel.setProperty('/OrgList', aOrgList);

          oListModel.setProperty('/search', {
            Zyymm: moment().format('yyyyMM'),
            Werks: mAppointee.Werks,
            Orgeh: aOrgList[0].Orgeh,
          });

          // 근무시간주차별 추이
          const aWorkTime = await this.getTypeWorkTime();

          oListModel.setProperty('/search/Disty', aWorkTime.Disty);
          this.buildDialChart(aWorkTime.WorkingTime1Nav.results);

          // const mSearch = oListModel.getProperty('/search');
          // const mPayLoad = {
          //   Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
          //   Apend: moment(mSearch.date).hours(9).toDate(),
          //   Menid: this.getCurrentMenuId(),
          //   ...mPernr,
          // };
          // const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          // const oTable = this.byId('workTable');

          // oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          // oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async onDate() {
        const oListModel = this.getViewModel();
        const aWorkTime = await this.getTypeWorkTime();

        this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onArea() {
        const oListModel = this.getViewModel();
        const aWorkTime = await this.getTypeWorkTime();

        this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onOrg() {
        const oListModel = this.getViewModel();
        const aWorkTime = await this.getTypeWorkTime();

        this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      // 근무시간주차별 추이
      async getTypeWorkTime() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = this.getViewModel().getProperty('/search');
        const mPayLoad = {
          Zyymm: mSearch.Zyymm,
          Werks: mSearch.Werks,
          Orgeh: mSearch.Orgeh,
          WorkingTime1Nav: [],
          WorkingTime2Nav: [],
          WorkingTime3Nav: [],
          WorkingTime4Nav: [],
        };

        return await Client.deep(oModel, 'WorkingTimeTrend', mPayLoad);
      },

      getDialChartOption() {
        return {
          //Cosmetics
          showValue: 1,
          valueFontSize: 12,
          showPivotBorder: 0,
          bgColor: 'transparent',
          theme: 'ocean',
        };
      },

      buildDialChart(aWorkTimeList = []) {
        const oChart = FusionCharts(this.sDialChartId);
        const aList = _.chain(aWorkTimeList)
          .map((e) => {
            return { label: e.Weektx };
          })
          .set(
            'v1',
            _.map(aWorkTimeList, (e) => {
              return { value: e.Nmtim };
            })
          )
          .set(
            'v2',
            _.map(aWorkTimeList, (e) => {
              return { value: e.Ottim };
            })
          )
          .set(
            'v3',
            _.map(aWorkTimeList, (e) => {
              return { value: e.Overcnt };
            })
          )
          .value();
        debugger;
        aWorkTimeList;

        if (!oChart) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sDialChartId,
              type: 'mscolumn2d',
              renderAt: 'chart-bar-container',
              width: '100%',
              height: '400px',
              dataFormat: 'json',
              dataSource: {
                chart: this.getDialChartOption(),
                categories: [
                  {
                    category: aList,
                  },
                ],
                dataset: [
                  {
                    seriesname: this.getBundleText('LABEL_32004'), // 법정
                    data: aList.v1,
                    color: '#5B9BD5',
                  },
                  {
                    seriesname: this.getBundleText('LABEL_01205'), // OT
                    data: aList.v2,
                    color: '#EE7827',
                  },
                  {
                    seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                    data: aList.v3,
                    color: '#A6A6A6',
                  },
                ],
              },
            }).render();
          });
        } else {
          oChart.setChartData(
            {
              chart: this.getDialChartOption(),
              categories: [
                {
                  category: aList,
                },
              ],
              dataset: [
                {
                  seriesname: this.getBundleText('LABEL_32004'), // 법정
                  data: aList.v1,
                },
                {
                  seriesname: this.getBundleText('LABEL_01205'), // OT
                  data: aList.v2,
                },
                {
                  seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                  data: aList.v3,
                },
              ],
            },
            'json'
          );
          oChart.render();
        }
      },

      // 근무시간
      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      onClick() {
        this.getRouter().navTo('workTimeChange-detail', { oDataKey: 'N' });
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
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
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

        this.getRouter().navTo('workTimeChange-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('workTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_32001'); // {근로시간현황}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
