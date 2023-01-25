/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/flextime/mobile/YearPlanBoxHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    YearPlanBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.mobile.List', {
      sAccty: 'E',

      initializeModel() {
        return {
          FullYear: '',
          pernr: '',
          full: moment().format('YYYY.MM'),
          month: moment().format('MM'),
          year: moment().format('YYYY'),
          appointee: {},
          menid: this.getCurrentMenuId(),
          isMss: this.isMss(),
          isHass: this.isHass(),
          WeekWorkDate: new Date(),
          MonthStrList: [],
          DailyWorkList: [],
          YearPlan: [
            {
              title: '',
              detail: [
                {
                  Atext1: '',
                  Appsttx1: '',
                  Ename: '',
                  Ename: '',
                },
              ],
            },
          ],
          WeekWork: {
            Wkrultx: '',
            WeekTime: 52,
            Tottime: 0,
            Bastime: 0,
            Ottime: 0,
            WorkTime: 0,
          },
          TimeTypes: {},
          DailyWorkList: [],
          DailyWorkCount: 1,
          yearPlan: [],
          plans: [],
          WorkMonths: [],
          VacaTypeList: [],
          WorkTypeUseList: [],
          vacationChart: {
            dUsed: 0,
            dPlan: 0,
            dUnPlan: 0,
            pUsed: 0,
            pPlan: 0,
            pUnPlan: 0,
            Month: moment().month() + 1,
          },
          summary: {
            list: [],
          },
          flextime: [],
          busy: false,
        };
      },

      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      formatZeroTime(sValue = '0') {
        return parseFloat(sValue) === 0 ? '0' : sValue;
      },

      formatDate(dBegDa, dEndDa) {
        const sBe = dBegDa ? moment(dBegDa).format('YYYY.MM.DD') : '';
        const sEn = dEndDa ? `~${moment(dEndDa).format('YYYY.MM.DD')}` : '';
        let sDateRange = `${sBe}${sEn}`;

        if (moment(dBegDa).format('YYYY.MM.DD') === moment(dEndDa).format('YYYY.MM.DD')) {
          sDateRange = sBe;
        }

        return sDateRange;
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const sPernr = oParameter.pernr ?? this.getAppointeeProperty('Pernr');
          const sYear = oParameter.year ?? moment().get('year');
          const sMonth = _.parseInt(oParameter.month ?? moment().get('month')) + 1;

          oViewModel.setProperty('/pernr', sPernr);
          oViewModel.setProperty('/year', _.toNumber(sYear));
          oViewModel.setProperty('/month', _.toNumber(sMonth));
          oViewModel.setProperty(
            '/full',
            moment()
              .year(sYear)
              .month(sMonth - 1)
              .format('YYYY.MM')
          );

          this.YearPlanBoxHandler = new YearPlanBoxHandler({ oController: this, sPernr });
          // this.setMonth();
          this.formYear();

          oViewModel.setProperty(
            '/MonthStrList',
            _.times(12, (e) => {
              return { label: `${e + 1}${this.getBundleText('LABEL_00253')}` }; // 월
            })
          );

          this.YearPlanBoxHandler.getYearPlan();
          this.setAppointeeDate();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      getFormatFloat(sVal = '0') {
        return parseFloat(sVal);
      },

      setMonth() {
        const oViewModel = this.getViewModel();
        const aMonth = [];

        for (let i = 1; i < 13; i++) {
          aMonth.push({ Zcode: i, Ztext: i + this.getBundleText('LABEL_00253') }); // 월
        }

        oViewModel.setProperty('/WorkMonths', aMonth);
        oViewModel.setProperty('/WorkMonth', moment().month() + 1);
      },

      // 년도 선택시 화면전체 년도
      formYear() {
        const oViewModel = this.getViewModel();

        return oViewModel.setProperty('/FullYear', `${oViewModel.getProperty('/year')}${this.getBundleText('LABEL_00252')}`); // 년
      },

      // 사원정보
      async setAppointeeDate() {
        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mFilters = {
            Ename: this.getViewModel().getProperty('/pernr'),
            Stat2: '3',
            Accty: 'M', // 권한 해제 : 타사 임직원도 검색 + 전화번호
          };

          const aEmployees = await Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
          const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

          this.getViewModel().setProperty(
            '/appointee',
            aEmployees.map((mEmployee) => {
              mEmployee.Photo = mEmployee.Photo || sUnknownAvatarImageURL;
              return mEmployee;
            })[0]
          );
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 년도 선택시 화면전체조회
      // async formRefresh(sBeYear) {
      async formRefresh() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          // const oModel = this.getModel(ServiceNames.WORKTIME);
          // const sWerks = this.getAppointeeProperty('Werks');
          // const sPernr = oViewModel.getProperty('/pernr');
          // const sYear = oViewModel.getProperty('/year');
          // const sMonth = oViewModel.getProperty('/month');
          // const sFull = oViewModel.getProperty('/full');

          // 요약
          // await this.readFlextimeSummary(sFull);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      handshakeSummaryData(mSummaryData) {
        return {
          ..._.omit(mSummaryData, ['__metadata', 'AssoFlexTimeBreakSet', 'AssoFlexTimeDetailSet']),
          Beguz: this.TimeUtils.nvl(mSummaryData.Beguz),
          Enduz: this.TimeUtils.nvl(mSummaryData.Enduz),
          Gaptim: _.toNumber(mSummaryData.Gaptim),
          Gaptimtx: _.toNumber(mSummaryData.Gaptim) > 0 ? `+${_.toNumber(mSummaryData.Gaptim)}` : _.toNumber(mSummaryData.Gaptim).toString(),
          Clsdatx: moment(mSummaryData.Clsda).format('YYYY.MM.DD'),
        };
      },

      async readFlextimeSummary(sZyymm) {
        try {
          const oViewModel = this.getViewModel();
          const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;

          oViewModel.setProperty('/full ', sYearMonth);

          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
            Actty: this.sAccty,
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sYearMonth,
          });

          oViewModel.setProperty('/summary/rowCount', 1);
          oViewModel.setProperty('/summary/list', [
            _.chain(aResults)
              .map((o) => this.handshakeSummaryData(o))
              .get(0, { Zyymm: sYearMonth })
              .value(),
          ]);

          // 현재일 > 마감일자인 경우 또는 HR확정='X'인 경우 조회모드로 변경
          if (moment().format('YYYYMMDD') > moment(aResults[0].Clsda).format('YYYYMMDD') || oViewModel.getProperty('/summary/list/0/Hrcfm') === 'X') {
            oViewModel.setProperty('/isMss', true);
          } else {
            oViewModel.setProperty('/isMss', this.isMss());
          }
        } catch (oError) {
          throw oError;
        }
      },

      onPressPrevYear() {
        const sBeYear = _.cloneDeep(this.getViewModel().getProperty('/year'));
        this.YearPlanBoxHandler.onPressPrevYear();
        this.formYear();
        this.formRefresh(sBeYear);
      },

      onPressNextYear() {
        const sBeYear = _.cloneDeep(this.getViewModel().getProperty('/year'));
        this.YearPlanBoxHandler.onPressNextYear();
        this.formYear();
        this.formRefresh(sBeYear);
      },

      onClickDay(oEvent) {
        this.YearPlanBoxHandler.onClickDay(oEvent);
      },

      formatGaptimtx: function (f1, f2) {
        var oGaptimtx = this.byId('Gaptimtx');
        oGaptimtx.removeStyleClass('color-07 color-08');

        if (f2 < 0) oGaptimtx.addStyleClass('color-08');
        else oGaptimtx.addStyleClass('color-07');

        return f1;
      },

      formatStatxt: function (f1, f2) {
        var oStatxt = this.byId('Statxt');
        oStatxt.removeStyleClass('color-07 color-08');

        if (f2 === '2') oStatxt.addStyleClass('color-08');
        else oStatxt.addStyleClass('color-07');

        return f1;
      },
    });
  }
);
