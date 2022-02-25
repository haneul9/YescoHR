sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
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
    BaseController,
    ChartsSetting
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewEmployee.Main', {
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

      onObjectMatched() {
        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.PA);
          const mFilters = { Zyear: '2022' };

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
        const mChartSetting = _.get(ChartsSetting.CHART, mChartInfo.Target);

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
              // .set(['data', 'chart', 'yAxisMaxValue'], '200')
              .set(
                ['data', 'data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartSetting);

            break;
          case 'hled':
            if (aChartDatas.length > 2) aChartDatas.shift();

            const iFirstValue = _.chain(aChartDatas).get([0, mChartInfo.UsedProp]).parseInt().value();
            const iSecondValue = _.chain(aChartDatas).get([1, mChartInfo.UsedProp]).parseInt().value();
            const sLimitValue = _.isEmpty(mChartInfo.Limit) ? _.chain(iFirstValue).add(iSecondValue).toString().value() : '100';

            _.chain(mChartSetting)
              .get('data')
              .set(['value'], sLimitValue)
              .set(['chart', 'upperLimit'], sLimitValue)
              .tap((o) => {
                _.chain(o)
                  .set(['colorrange', 'color', 0, 'minvalue'], '0')
                  .set(['colorrange', 'color', 0, 'maxvalue'], _.toString(iFirstValue))
                  .set(['colorrange', 'color', 1, 'minvalue'], _.toString(iFirstValue + 1))
                  .commit();

                if (mChartInfo.RangeCount === 3) {
                  _.chain(o)
                    .set(['colorrange', 'color', 1, 'maxvalue'], _.toString(_.add(iFirstValue, iSecondValue)))
                    .set(['colorrange', 'color', 2, 'minvalue'], _.toString(_.add(iFirstValue, iSecondValue) + 1))
                    .set(['colorrange', 'color', 2, 'maxvalue'], sLimitValue)
                    .commit();
                } else if (mChartInfo.RangeCount === 2) {
                  _.chain(o).set(['colorrange', 'color', 1, 'maxvalue'], sLimitValue).commit();
                }
              })
              .commit();

            this.callFusionChart(mChartSetting);

            break;
          case 'bar2d':
            _.chain(mChartSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '120')
              .set(
                ['data', 'data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callDetail-${mChartInfo.Headty},${o.Cod01}` }))
              )
              .commit();

            this.callFusionChart(mChartSetting);

            break;
          case 'doughnut2d':
            _.chain(mChartSetting)
              .set(['data', 'chart', 'paletteColors'], _.chain(ChartsSetting.COLORS).take(aChartDatas.length).join(',').value())
              .set(
                ['data', 'data'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt, value: o.Cnt01 }))
              )
              .commit();

            this.callFusionChart(mChartSetting);

            break;
          case 'mscolumn2d':
            _.chain(mChartSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '60')
              .set(
                ['data', 'categories', 0, 'category'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['data', 'dataset', 0], {
                seriesname: this.getBundleText('LABEL_28025'), // 팀원
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callDetail-${mChartInfo.Headty},A,${o.Ttltxt}` })),
              })
              .set(['data', 'dataset', 1], {
                seriesname: this.getBundleText('LABEL_28026'), // 팀장
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callDetail-${mChartInfo.Headty},BA,${o.Ttltxt}` })),
              })
              .commit();

            this.callFusionChart(mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart(mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        if (!FusionCharts(mChartSetting.id)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: mChartSetting.id,
              type: mChartSetting.type,
              renderAt: `${mChartSetting.id}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mChartSetting.data,
            }).render();
          });
        } else {
          const oChart = FusionCharts(mChartSetting.id);

          oChart.setChartData(mChartSetting.data, 'json');
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
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/dialog/busy', true);

        try {
          if (!this.oDetailDialog) {
            this.oDetailDialog = await Fragment.load({
              name: 'sap.ui.yesco.mvc.view.overviewEmployee.fragment.DialogDetail',
              controller: this,
            });

            this.getView().addDependent(this.oDetailDialog);
          }

          this.oDetailDialog.open();

          const aDetailData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'HeadCountDetail', { Zyear: '2022', ...mPayload });

          oViewModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          oViewModel.setProperty('/dialog/list', aDetailData);
          oViewModel.setProperty('/dialog/busy', false);
        } catch (oError) {
          this.debug('Controller > m/overviewEmployee Main > openDetailDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oDetailDialog.close(),
          });
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

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);

// eslint-disable-next-line no-unused-vars
function callDetail(sArgs) {
  const oController = sap.ui.getCore().byId('container-ehr---m_overviewEmployee').getController();
  const aArgs = _.split(sArgs, ',');
  const mPayload = _.size(aArgs) === 3 ? _.zipObject(['Headty', 'Discod', 'Zyear'], aArgs) : _.zipObject(['Headty', 'Discod'], aArgs);

  oController.openDetailDialog(mPayload);
}
