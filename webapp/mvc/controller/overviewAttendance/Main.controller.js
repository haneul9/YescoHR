sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewAttendance/constants/ChartsSetting',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Decimal',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController,
    ChartsSetting
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewAttendance.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Datum: moment().hours(9).toDate(),
            Werks: '',
            Orgeh: '',
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          contents: {
            A01: { busy: false, data: {} },
            A02: { busy: false, data: {} },
            A03: { busy: false, data: {} },
            A04: { busy: false, data: {} },
            A05: { busy: false },
            A06: { busy: false },
            A07: { busy: false },
            A08: { busy: false, data: {} },
            A09: { busy: false, data: {} },
            A10: { busy: false },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            list: [],
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'PersAreaList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Werks', mAppointee.Werks);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.times(6).forEach((idx) => oViewModel.setProperty(`/contents/A${_.padStart(++idx, 2, '0')}/busy`, bBusy));
      },

      async buildChart(oModel, mFilters, mChartInfo) {
        const oViewModel = this.getViewModel();
        const aChartDatas = await Client.getEntitySet(oModel, 'TimeOverview', { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);
        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        if (_.has(mChartInfo, 'Fields')) {
          oViewModel.setProperty(
            `/contents/${mChartInfo.Target}/data`,
            _.chain(vDataObject)
              .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
              .value()
          );
        }

        switch (mChartInfo.Chart) {
          case 'cylinder':
            _.chain(mChartSetting)
              .set(['chart', 'caption'], this.getBundleText('LABEL_01130'))
              .set('value', _.chain(aChartDatas).get([0, 'Rte01']).toNumber().value())
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'column2d':
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'bar2d':
            _.chain(mChartSetting)
              // .set(['chart', 'yAxisMaxValue'], '120')
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscombi2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesName: this.getBundleText('LABEL_28048'), // 당일
                showValues: '1',
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01 })),
              })
              .set(['dataset', 1], {
                seriesName: this.getBundleText('LABEL_00196'), // 누적
                renderAs: 'line',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02 })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscolumn2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_32004'), // 법정
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01 })),
              })
              .set(['dataset', 1], {
                seriesname: 'OT',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02 })),
              })
              .set(['dataset', 2], {
                seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt03 })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart(mChartInfo, mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        const sChartId = `attendance-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: sChartId,
              type: _.replace(mChartInfo.Chart, '-S', ''),
              renderAt: `${sChartId}-container`,
              width: _.has(mChartInfo, 'ChartWidth') ? mChartInfo.ChartWidth : '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();

            FusionCharts.addEventListener('rendered', function () {
              if (mChartInfo.Target === 'A06' || mChartInfo.Target === 'A03') {
                $(`#employeeOnOff-${_.toLower(mChartInfo.Target)}-chart g[class$="-parentgroup"] > g[class$="-sumlabels"] > g[class$="-sumlabels"] > text`).each(function (idx) {
                  $(this)
                    .off('click')
                    .on('click', function () {
                      const oController = sap.ui.getCore().byId('container-ehr---m_overviewAttendance').getController();
                      const oViewModel = oController.getViewModel();
                      const sHeadty = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/headty`);
                      const sDisyear = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/raw/${idx}/Ttltxt`);
                      const mPayload = _.zipObject(['Headty', 'Discod', 'Disyear'], [sHeadty, 'all', sDisyear]);

                      oController.openDetailDialog(mPayload);
                    })
                    .addClass('active-link');
                });
              }
            });
          });
        } else {
          const oChart = FusionCharts(sChartId);

          oChart.setChartData(mChartSetting, 'json');
          setTimeout(() => oChart.render(), 200);
        }
      },

      formatDetailRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 3:
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      async openDetailDialog(mPayload) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/dialog/busy', true);

        try {
          if (!this.oDetailDialog) {
            this.oDetailDialog = await Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail',
              controller: this,
            });

            oView.addDependent(this.oDetailDialog);
          }

          this.oDetailDialog.open();

          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.PA), _.get(mPayload, 'Entity') === 'A' ? 'HeadCountDetail' : 'HeadCountEntRetDetail', { Zyear: '2022', ..._.omit(mPayload, 'Entity') });

          oViewModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
          oViewModel.setProperty('/dialog/busy', false);
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > openDetailDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oDetailDialog.close(),
          });
        } finally {
          if (this.byId('overviewEmpDetailTable')) this.byId('overviewEmpDetailTable').setFirstVisibleRow();
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressCount(oEvent) {
        if (oEvent['getSource'] instanceof Function) {
          this.openDetailDialog(oEvent.getSource().data());
        } else {
          this.openDetailDialog(sap.ui.getCore().byId($(oEvent.currentTarget).attr('id')).data());
        }
      },

      onPressDetailDialogClose() {
        this.oDetailDialog.close();
      },

      onPressDetailExcelDownload() {
        const oTable = this.byId('overviewEmpDetailTable');
        const aTableData = this.getViewModel().getProperty('/dialog/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_28038'); // 인원현황상세

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps: ['Gbdat', 'Entda', 'Loada', 'Reida', 'Retda'] });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);

// eslint-disable-next-line no-unused-vars
function callDetail(sArgs) {
  const oController = sap.ui.getCore().byId('container-ehr---m_overviewAttendance').getController();
  const aProps = ['Headty', 'Discod', 'Disyear'];
  const aArgs = _.split(sArgs, ',');
  const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

  oController.openDetailDialog(mPayload);
}
