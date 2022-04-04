sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewEmployee/constants/ChartsSetting',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewEmployee.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Zyear: moment().format('YYYY'),
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
            A03: { busy: false, data: [] },
            A04: { busy: false, data: [] },
            A05: { busy: false, data: {} },
            A06: { busy: false, data: {} },
            A07: { busy: false, data: [] },
            A08: { busy: false, data: [] },
            A09: { busy: false, data: {} },
            A10: { busy: false },
            A11: { busy: false },
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
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Werks', mAppointee.Werks);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));

          const oModel = this.getModel(ServiceNames.PA);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.times(11).forEach((idx) => oViewModel.setProperty(`/contents/A${_.padStart(++idx, 2, '0')}/busy`, bBusy));
      },

      async buildChart(oModel, mFilters, mChartInfo) {
        const oViewModel = this.getViewModel();
        const aChartDatas = await Client.getEntitySet(oModel, 'HeadCountOverview', { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);

        if (!_.isUndefined(vDataObject)) {
          if (_.isArray(vDataObject)) {
            oViewModel.setProperty(
              `/contents/${mChartInfo.Target}/data`,
              _.map(aChartDatas, (o, i) => ({ ...o, Type: `type${_.padStart(++i, 2, '0')}` }))
            );
          } else {
            oViewModel.setProperty(
              `/contents/${mChartInfo.Target}/data`,
              _.chain(vDataObject)
                .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
                .value()
            );
          }
        }

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        switch (mChartInfo.Chart) {
          case 'column2d':
            _.chain(mChartSetting)
              // .set(['chart', 'yAxisMaxValue'], '200')
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callEmployeeDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'hled':
            if (aChartDatas.length > 2) aChartDatas.shift();

            const iFirstValue = _.chain(aChartDatas).get([0, mChartInfo.UsedProp]).parseInt().value();
            const iSecondValue = _.chain(aChartDatas).get([1, mChartInfo.UsedProp]).parseInt().value();
            const sLimitValue = _.isEmpty(mChartInfo.Limit) ? _.chain(iFirstValue).add(iSecondValue).toString().value() : '100';

            _.chain(mChartSetting)
              .set(['chart', 'upperLimit'], sLimitValue)
              .set(['value'], sLimitValue)
              .tap((o) => {
                _.chain(o)
                  .set(['colorrange', 'color', 0, 'code'], '#7BB4EB')
                  .set(['colorrange', 'color', 1, 'code'], '#FFAAAA')
                  .set(['colorrange', 'color', 0, 'minvalue'], '0')
                  .set(['colorrange', 'color', 0, 'maxvalue'], _.toString(iFirstValue))
                  .set(['colorrange', 'color', 1, 'minvalue'], _.toString(iFirstValue + 1))
                  .commit();

                if (mChartInfo.RangeCount === 3) {
                  _.chain(o)
                    .set(['colorrange', 'color', 2, 'code'], '#ededed')
                    .set(['colorrange', 'color', 1, 'maxvalue'], _.toString(_.add(iFirstValue, iSecondValue)))
                    .set(['colorrange', 'color', 2, 'minvalue'], _.toString(_.add(iFirstValue, iSecondValue) + 1))
                    .set(['colorrange', 'color', 2, 'maxvalue'], sLimitValue)
                    .commit();
                } else if (mChartInfo.RangeCount === 2) {
                  _.chain(o).set(['colorrange', 'color', 1, 'maxvalue'], sLimitValue).commit();
                }
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'bar2d':
            _.chain(mChartSetting)
              // .set(['chart', 'yAxisMaxValue'], '120')
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callEmployeeDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'doughnut2d':
            _.chain(mChartSetting)
              .set(['chart', 'paletteColors'], _.chain(ChartsSetting.COLORS).take(aChartDatas.length).join(',').value())
              .set(
                ['data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscolumn2d':
            _.chain(mChartSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '60')
              .set(
                ['categories', 0, 'category'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_28025'), // 임원 1인당 직원수 (팀장포함)
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callEmployeeDetail-${mChartInfo.Headty},A,${o.Ttltxt}` })),
              })
              .set(['dataset', 1], {
                seriesname: this.getBundleText('LABEL_28026'), // 팀장 1인당 직원수
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callEmployeeDetail-${mChartInfo.Headty},BA,${o.Ttltxt}` })),
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

        const sChartId = `employee-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: sChartId,
              type: mChartInfo.Chart,
              renderAt: `${sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();
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
              name: 'sap.ui.yesco.mvc.view.overviewEmployee.fragment.DialogDetail',
              controller: this,
            });

            oView.addDependent(this.oDetailDialog);
          }

          this.oDetailDialog.open();

          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'HeadCountDetail', { ...mSearchConditions, ...mPayload });

          oViewModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/totalCount', _.size(aDetailData));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
          oViewModel.setProperty('/dialog/busy', false);
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > openDetailDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oDetailDialog.close(),
          });
        } finally {
          $('#fusioncharts-tooltip-element').hide();
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
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.PA);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > onPressSearch Error', oError);

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

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Pernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
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
function callEmployeeDetail(sArgs) {
  const oController = sap.ui.getCore().byId('container-ehr---m_overviewEmployee').getController();
  const aProps = ['Headty', 'Discod', 'Zyear'];
  const aArgs = _.split(sArgs, ',');
  const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

  oController.openDetailDialog(mPayload);
}
