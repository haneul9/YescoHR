/* eslint-disable no-useless-call */
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.teamCalendar.Main', {
      isReadMore: false,
      readPerSize: 30,

      initializeModel() {
        return {
          auth: 'E',
          isLoaded: false,
          busy: {
            Tyymm: false,
            Werks: false,
            Orgeh: false,
            Button: false,
            Calendar: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          searchConditions: {
            Tyymm: '',
            Werks: '',
            Orgeh: '',
            Downinc: null,
          },
          calendar: {
            yearMonth: '',
            columnTemplate: '',
            raw: [],
            plans: [],
            remains: [],
            detail: {
              title: '',
              data: {},
            },
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          const bIsLoaded = oViewModel.getProperty('/isLoaded');

          this.bindInfiniteScroll();

          if (!bIsLoaded) {
            oViewModel.setSizeLimit(20000);
            oViewModel.setProperty('/auth', this.isMss() ? 'M' : this.isHass() ? 'H' : 'E');

            this.setContentsBusy(true);

            await this.initializeSearchConditions();

            this.setCalendarYearMonthLabel();
            this.setCalendarGridHeader();
            await this.loadCalendarData();

            this.buildCalendar();

            this.initializeTeamPlanPopover();
          }
        } catch (oError) {
          this.debug('Controller > teamCalendar > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      bindInfiniteScroll() {
        const oPage = this.getView().getContent()[0];

        oPage.addEventDelegate({
          onAfterRendering: () => {
            oPage
              .$()
              .find('.sapMPageEnableScrolling')
              .off('scroll')
              .on('scroll', _.throttle(this.fireScroll.bind(this), 100));
          },
        });
      },

      fireScroll() {
        if (this.isReadMore && this.isScrollBottom()) {
          this.openBusyDialog();
          setTimeout(() => this.readMore(), 0);
        }
      },

      isScrollBottom() {
        const $scrollDom = this.getView().getContent()[0].$().find('.sapMPageEnableScrolling');
        const iScrollMarginBottom = $scrollDom.prop('scrollHeight') - $scrollDom.prop('scrollTop');
        const iGrowHeight = $scrollDom.height();

        return $scrollDom.prop('scrollTop') > 0 && iScrollMarginBottom === iGrowHeight;
      },

      readMore() {
        const oViewModel = this.getViewModel();
        const aPlans = oViewModel.getProperty('/calendar/plans');
        const aRemains = oViewModel.getProperty('/calendar/remains');

        if (aRemains.length > this.readPerSize) {
          this.isReadMore = true;
          oViewModel.setProperty('/calendar/remains', _.drop(aRemains, this.readPerSize));
        } else {
          this.isReadMore = false;
          oViewModel.setProperty('/calendar/remains', []);
        }

        oViewModel.setProperty('/calendar/plans', [
          ...aPlans,
          ..._.chain(aRemains)
            .take(this.readPerSize)
            .reduce((acc, cur) => {
              return [...acc, ...this.convertPlanData(cur)];
            }, [])
            .value(),
        ]);

        setTimeout(() => this._oBusyDialog.close(), 500);
      },

      async openBusyDialog() {
        const oView = this.getView();

        if (!this._oBusyDialog) {
          this._oBusyDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.teamCalendar.fragment.LoadingDialog',
            controller: this,
          });

          oView.addDependent(this._oBusyDialog);
        }

        this._oBusyDialog.open();
      },

      async initializeTeamPlanPopover() {
        const oView = this.getView();

        this._oPlanDetailPopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.teamCalendar.fragment.TeamPlanPopover',
          controller: this,
        });

        oView.addDependent(this._oPlanDetailPopover);
      },

      setContentsBusy(bContentsBusy = true, vTarget = []) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(vTarget)) {
          oViewModel.setProperty('/busy', {
            Tyymm: bContentsBusy,
            Werks: bContentsBusy,
            Orgeh: bContentsBusy,
            Button: bContentsBusy,
            Calendar: bContentsBusy,
          });
        } else {
          if (_.isArray(vTarget)) {
            _.forEach(vTarget, (s) => oViewModel.setProperty(`/busy/${s}`, bContentsBusy));
          } else {
            oViewModel.setProperty(`/busy/${vTarget}`, bContentsBusy);
          }
        }
      },

      onPressSearch() {
        this.setContentsBusy(true, ['Button', 'Calendar']);
        this.setCalendarYearMonthLabel();

        setTimeout(() => {
          this.setCalendarGridHeader();
          this.retrieveCalendar();
        }, 0);
      },

      async retrieveCalendar() {
        try {
          await this.loadCalendarData();

          this.buildCalendar();
        } catch (oError) {
          this.debug('Controller > teamCalendar > retrieveCalendar Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Calendar']);
        }
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        this.setContentsBusy(true, 'Orgeh');

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
          oViewModel.setProperty(
            '/entry/Orgeh',
            _.map(aOrgehEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
        } catch (oError) {
          this.debug('Controller > teamCalendar > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'Orgeh');
        }
      },

      async initializeSearchConditions() {
        const oViewModel = this.getViewModel();

        try {
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/searchConditions', {
            Tyymm: _.isEmpty(mSearchConditions.Tyymm) ? moment().format('YYYYMM') : mSearchConditions.Tyymm,
            Werks: _.isEmpty(mSearchConditions.Werks) ? mAppointee.Werks : mSearchConditions.Werks,
            Orgeh: _.isEmpty(mSearchConditions.Orgeh) ? (_.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh'])) : mSearchConditions.Orgeh,
            Downinc: _.isEmpty(mSearchConditions.Downinc) ? null : mSearchConditions.Downinc,
          });
          oViewModel.setProperty(
            '/entry/Werks',
            _.map(aPersaEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
          oViewModel.setProperty(
            '/entry/Orgeh',
            _.map(aOrgehEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
        } catch (oError) {
          throw oError;
        }
      },

      buildCalendar() {
        const oViewModel = this.getViewModel();

        try {
          const aPlanData = oViewModel.getProperty('/calendar/raw');
          const sYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');
          const iCurrentDayInMonth = moment(sYearMonth).daysInMonth();

          oViewModel.setProperty('/calendar/plans', [
            ...this.getGridHeader(aPlanData, iCurrentDayInMonth, sYearMonth), //
            ...this.getGridBody(aPlanData),
          ]);
          oViewModel.setProperty('/calendar/raw', []);
        } catch (oError) {
          throw oError;
        }
      },

      getBoxObject({ day = 'NONE', label = '', empno, photo, moveToIndi = false, classNames = '', borderNames = 'Default', stripes = 'None', holiday = 'None' }) {
        return { day, label, empno, photo, moveToIndi, classNames, borderNames, stripes, holiday };
      },

      getGridBody(aPlanData) {
        const aPlanValues = _.chain(aPlanData).groupBy('Pernr').values().value();

        if (aPlanValues.length > this.readPerSize) {
          this.isReadMore = true;
          this.getViewModel().setProperty('/calendar/remains', _.drop(aPlanValues, this.readPerSize));
        } else {
          this.isReadMore = false;
          this.getViewModel().setProperty('/calendar/remains', []);
        }

        return _.chain(aPlanValues)
          .take(this.readPerSize)
          .reduce((acc, cur) => {
            return [...acc, ...this.convertPlanData(cur)];
          }, [])
          .value();
      },

      convertPlanData(aGridData) {
        return [
          this.getBoxObject({ label: _.get(aGridData, [0, 'Ename']), photo: _.get(aGridData, [0, 'Picurl']), classNames: 'Normal', empno: _.get(aGridData, [0, 'Pernr']), moveToIndi: true }), //
          this.getBoxObject({ label: _.get(aGridData, [0, 'Zzjikgbtx']), classNames: 'Normal' }),
          this.getBoxObject({ label: _.get(aGridData, [0, 'Orgtx']), classNames: 'Normal' }),
          ..._.map(aGridData, (o) => ({
            ..._.chain(o).pick(['Pernr', 'Colty', 'Ottyp', 'Appsttx1', 'Appsttx2', 'Atext1', 'Atext2', 'Atrsn1', 'Atrsn2', 'Duration1', 'Duration2']).omitBy(_.isEmpty).value(),
            label: '',
            day: moment(o.Tmdat).format('YYYYMMDD'),
            holiday: _.isEqual(o.Holyn, 'X') ? 'Holiday' : 'None',
            classNames: !_.isEmpty(o.Colty) ? o.Colty : _.includes(['6', '7'], o.Wkday) ? 'Weekend' : 'Normal',
            borderNames: !_.isEmpty(o.Ottyp) ? o.Ottyp : 'Default',
            stripes: _.isEqual(o.Cssty, 'P') ? 'Stripes' : 'None',
          })),
        ];
      },

      getGridHeader(aPlanData, iCurrentDayInMonth, sYearMonth) {
        const bSameMonth = _.isEmpty(sYearMonth) ? false : moment(sYearMonth).isSame(moment(), 'month');
        const iCurrentDate = moment().get('date') - 1;
        const aHolidays = _.isEmpty(aPlanData)
          ? []
          : _.chain(aPlanData)
              .filter({ Holyn: 'X' })
              .uniqBy('Tmday')
              .map((o) => _.toNumber(o.Tmday) - 1)
              .value();

        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_00210'), classNames: 'Header' }), // 성명
          this.getBoxObject({ label: this.getBundleText('LABEL_00136'), classNames: 'Header' }), // 직급/직책
          this.getBoxObject({ label: this.getBundleText('LABEL_00224'), classNames: 'Header' }), // 부서
          ..._.times(iCurrentDayInMonth, (d) =>
            this.getBoxObject({
              label: _.toString(d + 1),
              classNames: 'Header',
              holiday: _.includes(aHolidays, d) ? 'Holiday' : 'None',
              borderNames: bSameMonth && _.isEqual(iCurrentDate, d) ? 'Today' : 'Default',
            })
          ),
        ];
      },

      async loadCalendarData() {
        const oViewModel = this.getViewModel();

        try {
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TeamCalendar', {
            Pernr: this.getAppointeeProperty('Pernr'),
            ...mSearchConditions,
          });

          oViewModel.setProperty('/isLoaded', true);
          oViewModel.setProperty('/calendar/raw', aResults ?? []);
        } catch (oError) {
          throw oError;
        }
      },

      setCalendarYearMonthLabel() {
        const oViewModel = this.getViewModel();
        const sTyymm = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/calendar/yearMonth', moment(sTyymm).format(this.getBundleText('LABEL_37002'))); // YYYY년 M월
      },

      setCalendarGridHeader() {
        const oViewModel = this.getViewModel();
        const sTyymm = oViewModel.getProperty('/searchConditions/Tyymm');
        const iCurrentDayInMonth = moment(sTyymm).daysInMonth();

        oViewModel.setProperty('/calendar/columnTemplate', `100px 80px 120px repeat(${iCurrentDayInMonth}, 1fr)`);
        oViewModel.setProperty('/calendar/plans', this.getGridHeader([], iCurrentDayInMonth));
      },

      onPressPrevYear() {
        const oViewModel = this.getViewModel();
        const sCurrentYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/searchConditions/Tyymm', moment(sCurrentYearMonth).subtract(1, 'months').format('YYYYMM'));

        this.onPressSearch();
      },

      onPressNextYear() {
        const oViewModel = this.getViewModel();
        const sCurrentYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/searchConditions/Tyymm', moment(sCurrentYearMonth).add(1, 'months').format('YYYYMM'));

        this.onPressSearch();
      },

      async onPressDayBox(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();
        const mCustomData = oSource.data();

        if (mCustomData.moveToIndi) {
          const dSearchYearMonth = moment(oViewModel.getProperty('/searchConditions/Tyymm'));

          this.getRouter().navTo('individualWorkState', {
            pernr: mCustomData.empno,
            year: dSearchYearMonth.get('year'),
            month: dSearchYearMonth.get('month'),
          });
        } else {
          const [mSelectedDay] = _.filter(oViewModel.getProperty('/calendar/plans'), (o) => _.isEqual(o.Pernr, mCustomData.pernr) && _.isEqual(o.day, mCustomData.day));

          if (!mSelectedDay || (!mSelectedDay.Colty && !mSelectedDay.Ottyp)) {
            return;
          }

          oViewModel.setProperty('/calendar/detail/title', moment(mSelectedDay.day).format('YYYY.MM.DD'));
          oViewModel.setProperty('/calendar/detail/data', mSelectedDay);

          this._oPlanDetailPopover.openBy(oSource);
        }
      },
    });
  }
);
