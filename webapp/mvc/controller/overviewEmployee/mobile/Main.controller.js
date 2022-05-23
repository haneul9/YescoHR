sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewEmployee/constants/ChartsSetting',
    'sap/ui/yesco/mvc/controller/overviewEmployee/mobile/EmployeeList1PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewEmployee/mobile/EmployeeList2PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewEmployee/mobile/EmployeeList3PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewEmployee/mobile/EmployeeList4PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    ChartsSetting,
    EmployeeList1PopoverHandler,
    EmployeeList2PopoverHandler,
    EmployeeList3PopoverHandler,
    EmployeeList4PopoverHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewEmployee.mobile.Main', {
      initializeModel() {
        const iFullAgeCountingYear = moment().year();
        const mData = {
          ageMGen: `${iFullAgeCountingYear - 1995}~${iFullAgeCountingYear - 1980}`,
          ageZGen: `${iFullAgeCountingYear - 2010}~${iFullAgeCountingYear - 1996}`,
        };
        return {
          busy: false,
          searchAreaClose: false,
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
            A01: { busy: false, hasLink: false, data: {} },
            A02: { busy: false, hasLink: false, data: mData },
            A03: { busy: false, hasLink: false, data: [] },
            A04: { busy: false, hasLink: false, data: [] },
            A05: { busy: false, hasLink: false, data: {} },
            A06: { busy: false, hasLink: false, data: {} },
            A07: { busy: false, hasLink: false, data: [] },
            A08: { busy: false, hasLink: false, data: [] },
            A09: { busy: false, hasLink: false, data: {} },
            A10: { busy: false, hasLink: false },
            A11: { busy: false, hasLink: false },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            list: [],
          },
          isDevMobile: AppUtils.isMobile() && (AppUtils.isLOCAL() || AppUtils.isDEV() || AppUtils.isQAS()),
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/searchAreaClose', false);

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

          _.forEach(ChartsSetting.CHART_TYPE, (o) => {
            if (o.Device.includes('Mobile')) {
              this.buildChart(oModel, mFilters, o);
            }
          });

          this.oEmployeeList1PopoverHandler = new EmployeeList1PopoverHandler(this);
          this.oEmployeeList2PopoverHandler = new EmployeeList2PopoverHandler(this);
          this.oEmployeeList3PopoverHandler = new EmployeeList3PopoverHandler(this);
          this.oEmployeeList4PopoverHandler = new EmployeeList4PopoverHandler(this);

          window.callEmployeeDetail = (sArgs) => {
            const aProps = ['OData', 'Headty', 'Discod', 'Zyear'];
            const aArgs = _.split(`H,${sArgs}`, ',');
            const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

            this.callDetail(mPayload);
          };
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewEmployee Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.forEach(ChartsSetting.CHART_TYPE, (o) => {
          if (o.Device.includes('Mobile')) {
            oViewModel.setProperty(`/contents/${o.Target}/busy`, bBusy);
          }
        });
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
            let fColumn2dMaxValues = 0;
            _.chain(mChartSetting)
              // .set(['chart', 'yAxisMaxValue'], '200')
              .set(
                ['data'],
                _.map(aChartDatas, (o) => {
                  fColumn2dMaxValues = Math.max(fColumn2dMaxValues, Number(o.Cnt01));
                  return { label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callEmployeeDetail-${mChartInfo.Headty},${o.Cod01}` };
                })
              )
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fColumn2dMaxValues * 1.3);

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
          case 'scrollcolumn2d':
            let fMscolumn2dMaxValues = 0;
            _.chain(mChartSetting)
              // .set(['data', 'chart', 'yAxisMaxValue'], '60')
              .set(
                ['categories', 0, 'category'],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_28025'), // 임원 1인당 직원수 (팀장포함)
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt01));
                  return { value: o.Cnt01, link: `j-callEmployeeDetail-${mChartInfo.Headty},A,${o.Ttltxt}` };
                }),
              })
              .set(['dataset', 1], {
                seriesname: this.getBundleText('LABEL_28026'), // 팀장 1인당 직원수
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt02));
                  return { value: o.Cnt02, link: `j-callEmployeeDetail-${mChartInfo.Headty},BA,${o.Ttltxt}` };
                }),
              })
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fMscolumn2dMaxValues * 1.5);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart({ Target, Chart }, mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        const sChartId = `employee-${_.toLower(Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            const oChart = new FusionCharts({
              id: sChartId,
              type: Chart,
              renderAt: `${sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();

            if (AppUtils.isMobile() && sChartId === 'employee-a11-chart') {
              oChart.addEventListener('rendered', () => {
                setTimeout(() => {
                  const aStyleClasses = ['scroll-color', 'scroll-radius'];
                  aStyleClasses.push(/iphone|ipad|ipod/i.test(navigator.userAgent) ? 'scroll-h1 legend-m1d5' : 'scroll-h4');
                  $(`#${sChartId}.fusioncharts-container`).addClass(aStyleClasses.join(' '));
                }, 300);
              });
            }
          });
        } else {
          const oChart = FusionCharts(sChartId);

          oChart.setChartData(mChartSetting, 'json');
          setTimeout(() => oChart.render(), 200);
        }
      },

      callDetail(mPayload) {
        const mSearchConditions = this.getViewModel().getProperty('/searchConditions');

        this.openDialog({ ...mSearchConditions, ...mPayload });
      },

      openDialog(mPayload) {
        const $ChartTooltip = $('#fusioncharts-tooltip-element').css('z-index', 7);
        setTimeout(() => {
          $ChartTooltip.hide();
        }, 3000);

        switch (mPayload.Headty) {
          case 'A': // A01 인원현황
          case 'E': // A06 성별 현황
          case 'F': // A10 조직별 현황
            this.oEmployeeList1PopoverHandler.openPopover(mPayload);
            break;
          case 'C': // A09 평균 연령
          case 'D': // A02 세대별 현황
            this.oEmployeeList2PopoverHandler.openPopover(mPayload);
            break;
          case 'G': // A03 유형별 현황
          case 'H': // A07 직급별 현황
          case 'I': // A04 직책별 현황
          case 'J': // A08 직군별 현황
          case 'K': // A11 임원/팀장 1인당 직원수
            this.oEmployeeList3PopoverHandler.openPopover(mPayload);
            break;
          case 'B': // A05 평균 근속
            this.oEmployeeList4PopoverHandler.openPopover(mPayload);
            break;
          default:
            break;
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oEvent.getParameter('changedItem').getKey(),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh'], ''));
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewEmployee Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.PA);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(ChartsSetting.CHART_TYPE, (o) => {
            if (o.Device.includes('Mobile')) {
              this.buildChart(oModel, mFilters, o);
            }
          });
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewEmployee Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressCount(oEvent) {
        this.callDetail(oEvent.getSource().data());
      },

      onPressSearchAreaToggle() {
        const bExpanded = $('.row-3').length === 1;
        $('.search-area').toggleClass('row-3', !bExpanded).toggleClass('row-0', bExpanded);
        this.getViewModel().setProperty('/searchAreaClose', bExpanded);
      },

      onChangeFontSize(oEvent) {
        const sFontSize = oEvent.getSource().getSelectedKey();
        document.querySelector(':root').style.setProperty('--StatisticNumberFontSize', sFontSize);
      },

      reduceViewResource() {
        this.oEmployeeList1PopoverHandler.destroy();
        this.oEmployeeList2PopoverHandler.destroy();
        this.oEmployeeList3PopoverHandler.destroy();
        this.oEmployeeList4PopoverHandler.destroy();
        Object.values(FusionCharts.items).forEach((oChart) => {
          oChart.dispose();
        });
        return this;
      },

      onChangeLegendPosition(oEvent) {
        $('.fusioncharts-container').attr('class', 'fusioncharts-container ' + oEvent.getParameter('value'));
      },

      onChangeScrollHeightCss(oEvent) {
        $('.fusioncharts-container').attr('class', 'fusioncharts-container ' + oEvent.getParameter('value'));
      },

      onChangeScrollHeight(oEvent) {
        FusionCharts('employee-a11-chart').setChartAttribute('scrollHeight', oEvent.getParameter('value'));
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
