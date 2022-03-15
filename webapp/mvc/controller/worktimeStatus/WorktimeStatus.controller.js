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
      MSCOLUMN_CHART_ID: 'columnChart',
      ORG_TABLE_ID: 'orgTable',
      PERNR_TABLE_ID: 'pernrTable',

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
          detail: {
            org: {
              list: [],
              rowCount: 2,
            },
            pernr: {
              list: [],
              rowCount: 2,
            },
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

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId(this.ORG_TABLE_ID),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });

        TableUtils.adjustRowSpan({
          oTable: this.byId(this.PERNR_TABLE_ID),
          aColIndices: [0, 1, 2, 3, 4, 5],
          sTheadOrTbody: 'thead',
        });

        TableUtils.summaryColspan({ oTable: this.byId(this.ORG_TABLE_ID), aHideIndex: [1] });
        TableUtils.summaryColspan({ oTable: this.byId(this.PERNR_TABLE_ID), aHideIndex: [1, 2, 3, 4, 5] });
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

          oListModel.setProperty('/Data', aWorkTime);
          oListModel.setProperty('/search/Disty', aWorkTime.Disty);
          this.buildDialChart(aWorkTime.WorkingTime1Nav.results);

          const sSumLabel = this.getBundleText('LABEL_00172'); // 합계

          if (oListModel.getProperty('/search/Disty') === '1') {
            const aPernrList = aWorkTime.WorkingTime3Nav.results;
            const mSumRow = TableUtils.generateSumRow({
              aTableData: aPernrList,
              mSumField: { Status: sSumLabel },
              vCalcProps: ['Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55'],
            });

            oListModel.setProperty('/detail/pernr/list', [...aPernrList, mSumRow]);
            oListModel.setProperty('/detail/pernr/Label1', aPernrList[0].Wktx1);
            oListModel.setProperty('/detail/pernr/Label2', aPernrList[0].Wktx2);
            oListModel.setProperty('/detail/pernr/Label3', aPernrList[0].Wktx3);
            oListModel.setProperty('/detail/pernr/Label4', aPernrList[0].Wktx4);
            oListModel.setProperty('/detail/pernr/Label5', aPernrList[0].Wktx5);
            oListModel.setProperty('/detail/pernr/rowCount', _.size([...aPernrList, mSumRow]));
          } else {
            const aOrgList = aWorkTime.WorkingTime2Nav.results;
            const mSumRow = TableUtils.generateSumRow({
              aTableData: aOrgList,
              mSumField: { Status: sSumLabel },
              vCalcProps: ['Empcnt', 'Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55', 'Over1', 'Over2', 'Over3', 'Over4', 'Over5'],
            });

            oListModel.setProperty('/detail/org/list', [...aOrgList, mSumRow]);
            oListModel.setProperty('/detail/org/Label1', aOrgList[0].Wktx1);
            oListModel.setProperty('/detail/org/Label2', aOrgList[0].Wktx2);
            oListModel.setProperty('/detail/org/Label3', aOrgList[0].Wktx3);
            oListModel.setProperty('/detail/org/Label4', aOrgList[0].Wktx4);
            oListModel.setProperty('/detail/org/Label5', aOrgList[0].Wktx5);
            oListModel.setProperty('/detail/org/rowCount', _.size([...aOrgList, mSumRow]));
          }
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
          // 근무시간주차별 추이
          const aWorkTime = await this.getTypeWorkTime();

          oListModel.setProperty('/Data', aWorkTime);
          this.buildDialChart(aWorkTime.WorkingTime1Nav.results);

          const sSumLabel = this.getBundleText('LABEL_00172'); // 합계

          if (oListModel.getProperty('/search/Disty') === '1') {
            const aPernrList = aWorkTime.WorkingTime3Nav.results;
            const mSumRow = TableUtils.generateSumRow({
              aTableData: aPernrList,
              mSumField: { Status: sSumLabel },
              vCalcProps: ['Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55'],
            });

            oListModel.setProperty('/detail/pernr/list', [...aPernrList, mSumRow]);
            oListModel.setProperty('/detail/pernr/Label1', aPernrList[0].Wktx1);
            oListModel.setProperty('/detail/pernr/Label2', aPernrList[0].Wktx2);
            oListModel.setProperty('/detail/pernr/Label3', aPernrList[0].Wktx3);
            oListModel.setProperty('/detail/pernr/Label4', aPernrList[0].Wktx4);
            oListModel.setProperty('/detail/pernr/Label5', aPernrList[0].Wktx5);
            oListModel.setProperty('/detail/pernr/rowCount', _.size([...aPernrList, mSumRow]));
          } else {
            const aOrgList = aWorkTime.WorkingTime2Nav.results;
            const mSumRow = TableUtils.generateSumRow({
              aTableData: aOrgList,
              mSumField: { Status: sSumLabel },
              vCalcProps: ['Empcnt', 'Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55', 'Over1', 'Over2', 'Over3', 'Over4', 'Over5'],
            });

            oListModel.setProperty('/detail/org/list', [...aOrgList, mSumRow]);
            oListModel.setProperty('/detail/org/Label1', aOrgList[0].Wktx1);
            oListModel.setProperty('/detail/org/Label2', aOrgList[0].Wktx2);
            oListModel.setProperty('/detail/org/Label3', aOrgList[0].Wktx3);
            oListModel.setProperty('/detail/org/Label4', aOrgList[0].Wktx4);
            oListModel.setProperty('/detail/org/Label5', aOrgList[0].Wktx5);
            oListModel.setProperty('/detail/org/rowCount', _.size([...aOrgList, mSumRow]));
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async onDate() {
        // const aWorkTime = await this.getTypeWorkTime();
        // this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onArea() {
        // const aWorkTime = await this.getTypeWorkTime();
        // this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onOrg() {
        // const aWorkTime = await this.getTypeWorkTime();
        // this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onGubun() {
        const oListModel = this.getViewModel();
        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계

        if (oListModel.getProperty('/search/Disty') === '1') {
          const aPernrList = oListModel.getProperty('/Data/WorkingTime3Nav/results');
          const mSumRow = TableUtils.generateSumRow({
            aTableData: aPernrList,
            mSumField: { Status: sSumLabel },
            vCalcProps: ['Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55'],
          });

          oListModel.setProperty('/detail/pernr/list', [...aPernrList, mSumRow]);
          oListModel.setProperty('/detail/pernr/Label1', aPernrList[0].Wktx1);
          oListModel.setProperty('/detail/pernr/Label2', aPernrList[0].Wktx2);
          oListModel.setProperty('/detail/pernr/Label3', aPernrList[0].Wktx3);
          oListModel.setProperty('/detail/pernr/Label4', aPernrList[0].Wktx4);
          oListModel.setProperty('/detail/pernr/Label5', aPernrList[0].Wktx5);
          oListModel.setProperty('/detail/pernr/rowCount', _.size([...aPernrList, mSumRow]));
        } else {
          const aOrgList = oListModel.getProperty('/Data/WorkingTime2Nav/results');
          const mSumRow = TableUtils.generateSumRow({
            aTableData: aOrgList,
            mSumField: { Status: sSumLabel },
            vCalcProps: ['Empcnt', 'Tim11', 'Tim12', 'Tim13', 'Tim14', 'Tim15', 'Tim21', 'Tim22', 'Tim23', 'Tim24', 'Tim25', 'Tim31', 'Tim32', 'Tim33', 'Tim34', 'Tim35', 'Tim41', 'Tim42', 'Tim43', 'Tim44', 'Tim45', 'Tim51', 'Tim52', 'Tim53', 'Tim54', 'Tim55', 'Over1', 'Over2', 'Over3', 'Over4', 'Over5'],
          });

          oListModel.setProperty('/detail/org/list', [...aOrgList, mSumRow]);
          oListModel.setProperty('/detail/org/Label1', aOrgList[0].Wktx1);
          oListModel.setProperty('/detail/org/Label2', aOrgList[0].Wktx2);
          oListModel.setProperty('/detail/org/Label3', aOrgList[0].Wktx3);
          oListModel.setProperty('/detail/org/Label4', aOrgList[0].Wktx4);
          oListModel.setProperty('/detail/org/Label5', aOrgList[0].Wktx5);
          oListModel.setProperty('/detail/org/rowCount', _.size([...aOrgList, mSumRow]));
        }
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
          baseFontSize: 13,
          valueFontSize: 13,
          legendItemFontSize: 13,
          chartBottomMargin: 0,
          divLineColor: '#eeeeee',
          divLineDashed: 0,
          drawCustomLegendIcon: 1,
          legendIconSides: 1,
          numDivLines: 3,
          placeValuesInside: 0,
          plotBorderColor: '#ffffff',
          rotateValues: 0,
          valueBgColor: 'transparent',
          valueFontColor: '#000000',
          bgColor: 'transparent',
          theme: 'ocean',
        };
      },

      buildDialChart(aWorkTimeList = []) {
        const oChart = FusionCharts(this.MSCOLUMN_CHART_ID);
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

        if (!oChart) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.MSCOLUMN_CHART_ID,
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
            'json'
          );
          oChart.render();
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        this.getRouter().navTo('workTimeChange-detail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
