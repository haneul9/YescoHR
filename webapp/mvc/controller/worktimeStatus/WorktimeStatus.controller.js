sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.worktimeStatus.WorktimeStatus', {
      MSCOLUMN_CHART_ID: 'columnChart',
      ORG_TABLE_ID: 'orgTable',
      PERNR_TABLE_ID: 'pernrTable',
      DIALOG_ORG_TABLE_ID: 'dialogOrgTable',

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
            dialog: {
              org: {
                list: [],
                rowCount: 2,
              },
              pernr: {
                list: [],
                rowCount: 2,
              },
            },
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

      formatTime(sValue = '0') {
        return _.parseInt(sValue) === 0 ? '' : sValue;
      },

      onBeforeShow() {
        this.TableUtils.adjustRowSpan({
          oTable: this.byId(this.ORG_TABLE_ID),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
          bMultiLabel: true,
        });

        this.TableUtils.adjustRowSpan({
          oTable: this.byId(this.PERNR_TABLE_ID),
          aColIndices: [0, 1, 2, 3, 4, 5],
          sTheadOrTbody: 'thead',
          bMultiLabel: true,
        });
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();

          const [aAreaList, aOrgList] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'PersAreaList', { Pernr: mAppointee.Pernr }),
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
          this.tableSetting(oListModel.getProperty('/search/Disty'));
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
          this.tableSetting(oListModel.getProperty('/search/Disty'));
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
        const oListModel = this.getViewModel();
        const oCommonModel = this.getModel(ServiceNames.COMMON);
        const aOrgList = await Client.getEntitySet(oCommonModel, 'DashboardOrgList', {
          Pernr: this.getAppointeeProperty('Pernr'),
          Werks: oListModel.getProperty('/search/Werks'),
        });

        oListModel.setProperty('/OrgList', aOrgList);
        oListModel.setProperty('/search/Orgeh', aOrgList[0].Orgeh);
      },

      async onOrg() {
        // const aWorkTime = await this.getTypeWorkTime();
        // this.buildDialChart(aWorkTime.WorkingTime1Nav.results);
      },

      async onGubun() {
        this.tableSetting(this.getViewModel().getProperty('/search/Disty'));
      },

      tableSetting(sDisty) {
        const oListModel = this.getViewModel();

        if (sDisty === '1') {
          const aPernrList = oListModel.getProperty('/Data/WorkingTime3Nav/results');

          oListModel.setProperty('/detail/pernr/list', aPernrList);
          oListModel.setProperty('/detail/pernr/Label1', aPernrList[0].Wktx1);
          oListModel.setProperty('/detail/pernr/Label2', aPernrList[0].Wktx2);
          oListModel.setProperty('/detail/pernr/Label3', aPernrList[0].Wktx3);
          oListModel.setProperty('/detail/pernr/Label4', aPernrList[0].Wktx4);
          oListModel.setProperty('/detail/pernr/Label5', aPernrList[0].Wktx5);
          oListModel.setProperty('/detail/pernr/rowCount', _.size(aPernrList) > 10 ? 10 : _.size(aPernrList));
        } else {
          const aOrgList = oListModel.getProperty('/Data/WorkingTime2Nav/results');

          oListModel.setProperty('/detail/org/list', aOrgList);
          oListModel.setProperty('/detail/org/Label1', aOrgList[0].Wktx1);
          oListModel.setProperty('/detail/org/Label2', aOrgList[0].Wktx2);
          oListModel.setProperty('/detail/org/Label3', aOrgList[0].Wktx3);
          oListModel.setProperty('/detail/org/Label4', aOrgList[0].Wktx4);
          oListModel.setProperty('/detail/org/Label5', aOrgList[0].Wktx5);
          oListModel.setProperty('/detail/org/rowCount', _.size(aOrgList) > 10 ? 10 : _.size(aOrgList));
          setTimeout(() => $('#container-ehr---m_worktimeStatus--orgTable-header-fixed-fixrow').addClass('h-90-px'), 50);
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
        return FusionCharts.curryChartOptions({
          yAxisMaxValue: 60,
          divLineColor: '#eeeeee',
          divLineDashed: 0,
          drawCustomLegendIcon: 1,
          legendIconSides: 0, // 범례 n각형 아이콘
          chartTopMargin: 15,
          chartLeftMargin: 10,
          plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesName-$label</th><td>$value</td></tr></table></div>",
        });
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
            FusionCharts.getInstance({
              id: this.MSCOLUMN_CHART_ID,
              type: 'mscolumn2d',
              renderAt: 'chart-bar-container',
              width: '100%',
              height: '100%',
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
                    color: '#007bff',
                  },
                  {
                    seriesname: this.getBundleText('LABEL_01205'), // OT
                    data: aList.v2,
                    color: '#fd5f58',
                  },
                  {
                    seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                    data: aList.v3,
                    color: '#a6a6a6',
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
                  color: '#007bff',
                },
                {
                  seriesname: this.getBundleText('LABEL_01205'), // OT
                  data: aList.v2,
                  color: '#fd5f58',
                },
                {
                  seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                  data: aList.v3,
                  color: '#a6a6a6',
                },
              ],
            },
            'json'
          );
          oChart.render();
        }
      },

      async onOrgClick(oEvent) {
        if (!this._pOrgDialog) {
          const oView = this.getView();

          this._pOrgDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.worktimeStatus.fragment.DialogOrgTable',
            controller: this,
          });

          oView.addDependent(this._pOrgDialog);

          this.TableUtils.adjustRowSpan({
            oTable: this.byId(this.DIALOG_ORG_TABLE_ID),
            aColIndices: [0, 1, 2, 3, 4, 5],
            sTheadOrTbody: 'thead',
            bMultiLabel: true,
          });
        }

        const oListModel = this.getViewModel();
        const oRowData = oEvent.getSource().getParent().getBindingContext().getProperty();
        const aDialogList = _.chain(oListModel.getProperty('/Data/WorkingTime3Nav/results'))
          .filter((e) => {
            return e.Orgtx === oRowData.Orgtx;
          })
          .map((e, i) => {
            return { ...e, No: i + 1 };
          })
          .value();

        oListModel.setProperty('/detail/dialog/org/list', aDialogList);
        oListModel.setProperty('/detail/dialog/org/Label1', aDialogList[0].Wktx1);
        oListModel.setProperty('/detail/dialog/org/Label2', aDialogList[0].Wktx2);
        oListModel.setProperty('/detail/dialog/org/Label3', aDialogList[0].Wktx3);
        oListModel.setProperty('/detail/dialog/org/Label4', aDialogList[0].Wktx4);
        oListModel.setProperty('/detail/dialog/org/Label5', aDialogList[0].Wktx5);
        oListModel.setProperty('/detail/dialog/org/rowCount', _.size(aDialogList) > 10 ? 10 : _.size(aDialogList));

        this._pOrgDialog.open();
      },

      async onPernrClick(oEvent) {
        if (!this._pPernrDialog) {
          const oView = this.getView();

          this._pPernrDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.worktimeStatus.fragment.DialogPernrTable',
            controller: this,
          });

          oView.addDependent(this._pPernrDialog);
        }

        const oListModel = this.getViewModel();
        const oRowData = oEvent.getSource().getParent().getBindingContext().getProperty();
        const aDialogList = _.chain(oListModel.getProperty('/Data/WorkingTime4Nav/results'))
          .filter((e) => {
            return e.Pernr === oRowData.Pernr;
          })
          .map((e, i) => {
            return { ...e, No: i + 1 };
          })
          .value();

        oListModel.setProperty('/detail/dialog/pernr/list', aDialogList);
        oListModel.setProperty('/detail/dialog/pernr/rowCount', _.size(aDialogList) > 10 ? 10 : _.size(aDialogList));

        this._pPernrDialog.open();
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      onPressPernrExcelDownload() {
        const oTable = this.byId('pernrTable');

        this.onPressExcelDownload(oTable);
      },
      onPressOrgExcelDownload() {
        const oTable = this.byId('orgTable');

        this.onPressExcelDownload(oTable);
      },
      onPressExcelDownload(oTable) {
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_32001'); // {근로시간현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
