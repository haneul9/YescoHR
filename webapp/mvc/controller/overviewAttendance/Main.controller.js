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
            Begda: moment().hours(9).toDate(),
            Orgeh: '',
            entryOrgeh: [],
          },
          contents: {
            A01: { busy: false, data: {} },
            A02: { busy: false, data: [] },
            A03: { busy: false, data: { headty: 'E', raw: [] } },
            A04: { busy: false },
            A05: { busy: false, data: [] },
            A06: { busy: false, data: { headty: 'E', raw: [] } },
            A07: { busy: false },
            A08: { busy: false, data: [] },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            list: [],
          },
        };
      },

      onObjectMatched() {
        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.PA);
          const mFilters = { Zyear: '2022' };

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
        const aChartDatas = await Client.getEntitySet(oModel, mChartInfo.EntityType, { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);
        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        switch (mChartInfo.Chart) {
          case 'none':
            oViewModel.setProperty(
              `/contents/${mChartInfo.Target}/data`,
              _.chain(vDataObject)
                .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
                .value()
            );

            break;
          case 'stackedcolumn2d-S':
            const aLegends = _.chain(aChartDatas)
              .head()
              .pickBy((v, p) => _.startsWith(p, 'Leg') && !_.isEmpty(v))
              .values()
              .map((v, i) => ({
                label: v,
                count: _.get(aChartDatas, [0, `Cnt${_.padStart(i + 1, 2, '0')}`]),
                color: ChartsSetting.COLORS[i],
                code: _.get(aChartDatas, [0, `Cod${_.padStart(i + 1, 2, '0')}`]),
                value: _.get(aChartDatas, [0, `Cnt${_.padStart(i + 1, 2, '0')}`]),
                type: `type${_.padStart(i + 1, 2, '0')}`,
              }))
              .value();

            oViewModel.setProperty(`/contents/${mChartInfo.Target}/data/total`, _.get(aChartDatas, [0, 'Total']));
            oViewModel.setProperty(`/contents/${mChartInfo.Target}/data/legends`, aLegends);

            _.chain(mChartSetting)
              .set(['categories', 0, 'category', 0], { label: _.get(aChartDatas, [0, 'Ttltxt']) })
              .set(
                'dataset',
                _.chain(aLegends)
                  .cloneDeep()
                  .reverse()
                  .map((o) => ({ seriesname: o.label, color: o.color, data: [{ value: o.value, link: `j-callDetail-${mChartInfo.Headty},${o.code}` }] }))
                  .value()
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'stackedcolumn2d':
            oViewModel.setProperty(`/contents/${mChartInfo.Target}/data/raw`, aChartDatas);

            const aDataSet = _.chain(aChartDatas)
              .head()
              .pickBy((v, p) => _.startsWith(p, 'Leg') && !_.isEmpty(v))
              .values()
              .map((v, i) => ({
                label: v,
                color: ChartsSetting.COLORS[i],
                code: _.get(aChartDatas, [0, `Cod${_.padStart(i + 1, 2, '0')}`]),
                values: _.chain(aChartDatas)
                  .map((o) => ({
                    value: _.chain(o)
                      .pick(`Cnt${_.padStart(i + 1, 2, '0')}`)
                      .values()
                      .head()
                      .value(),
                  }))
                  .value(),
              }))
              .value();

            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(
                'dataset',
                _.chain(aDataSet)
                  .reverse()
                  .map((o) => ({ seriesname: o.label, color: o.color, data: _.map(o.values, (v, i) => ({ ...v, showValue: _.gt(v.value, mChartInfo.minDisplayValue) ? 1 : 0, link: `j-callDetail-${mChartInfo.Headty},${o.code},${_.get(aChartDatas, [i, 'Ttltxt'])}` })) }))
                  .value()
              )
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'msstackedcolumn2dlinedy':
            oViewModel.setProperty(`/contents/${mChartInfo.Target}/data/raw`, aChartDatas);

            const aDataSet2 = _.chain(aChartDatas)
              .head()
              .pickBy((v, p) => _.startsWith(p, 'Leg') && !_.isEmpty(v))
              .values()
              .map((v, i) => ({
                label: v,
                color: ChartsSetting.COLORS[i],
                code: _.get(aChartDatas, [0, `Cod${_.padStart(i + 1, 2, '0')}`]),
                values: _.chain(aChartDatas)
                  .map((o) => ({
                    value: _.chain(o)
                      .pick(`Cnt${_.padStart(i + 1, 2, '0')}`)
                      .values()
                      .head()
                      .value(),
                  }))
                  .value(),
              }))
              .value();

            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(
                ['dataset', 0, 'dataset'],
                _.chain(aDataSet2)
                  .reverse()
                  .map((o) => ({ seriesname: o.label, color: o.color, data: _.map(o.values, (v, i) => ({ ...v, showValue: _.gt(v.value, mChartInfo.minDisplayValue) ? 1 : 0, link: `j-callDetail-${mChartInfo.Headty},${o.code},${_.get(aChartDatas, [i, 'Ttltxt'])}` })) }))
                  .value()
              )
              .set(['lineset', 0], {
                seriesname: 'Total',
                showValues: '1',
                valuePosition: 'ABOVE',
                color: '#333333',
                anchorAlpha: 30,
                anchorBgColor: '#333333',
                includeInLegend: 0,
                anchorBorderThickness: '0',
                lineThickness: '0.5',
                data: _.map(aChartDatas, (o) => ({ value: o.Total2 })),
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

        const sChartId = `employeeOnOff-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: sChartId,
              type: _.replace(mChartInfo.Chart, '-S', ''),
              renderAt: `${sChartId}-container`,
              width: '100%',
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
      onPressSearch() {},

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
