/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.teamCalendar.mobile.Main', {
      initializeModel() {
        return {
          auth: 'E',
          isLoaded: false,
          busy: {
            Werks: false,
            Orgeh: false,
            Button: false,
            Calendar: false,
            Detail: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          searchConditions: {
            Tyymm: '',
            Werks: '',
            Orgeh: '',
          },
          calendar: {
            yearMonth: '',
            columnTemplate: '',
            raw: [],
            plans: [],
          },
          detail: {
            displayDate: '',
            list: [],
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          const bIsLoaded = oViewModel.getProperty('/isLoaded');

          if (!bIsLoaded) {
            oViewModel.setProperty('/auth', this.isMss() ? 'M' : this.isHass() ? 'H' : 'E');

            this.setContentsBusy(true);

            await this.initializeSearchConditions();

            this.setCalendarYearMonthLabel();
            await Promise.all([
              this.loadCalendarData(), //
              this.loadDetailReasonData(moment().format('YYYYMMDD')),
            ]);

            this.buildCalendar();
          }
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      setContentsBusy(bContentsBusy = true, vTarget = []) {
        const oViewModel = this.getViewModel();
        const mBusy = oViewModel.getProperty('/busy');

        if (_.isEmpty(vTarget)) {
          _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
        } else {
          if (_.isArray(vTarget)) {
            _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
          } else {
            _.set(mBusy, vTarget, bContentsBusy);
          }
        }

        oViewModel.refresh();
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

      setCalendarYearMonthLabel() {
        const oViewModel = this.getViewModel();
        const sTyymm = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/calendar/yearMonth', moment(sTyymm).format('YYYY.MM')); // YYYY년 M월
      },

      buildCalendar() {
        const oViewModel = this.getViewModel();

        try {
          const aPlanData = oViewModel.getProperty('/calendar/raw');
          const sYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');

          oViewModel.setProperty('/calendar/plans', [
            ...this.getGridHeader(), //
            ...this.getGridBody(aPlanData, sYearMonth),
          ]);
          oViewModel.setProperty('/calendar/raw', []);
        } catch (oError) {
          throw oError;
        }
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '', borderNames = 'None', stripes = 'None', holiday = 'None' }) {
        return { day, label, classNames, borderNames, stripes, holiday };
      },

      getGridHeader() {
        return _.chain(this.getBundleText('LABEL_00346'))
          .split(',')
          .map((s, i) => this.getBoxObject({ label: s, holiday: i > 4 ? 'Holiday' : 'None' }))
          .value();
      },

      getGridBody(aPlanData, sYearMonth) {
        const dFirstDayOfMonth = moment(sYearMonth);
        const iFirstDay = dFirstDayOfMonth.day();
        const iLastDay = dFirstDayOfMonth.endOf('month').day();
        const iLeadingNoneCount = iFirstDay === 0 ? 6 : iFirstDay - 1;
        const iTrailingNoneCount = iLastDay === 0 ? 0 : 7 - iLastDay;
        const aLeadingNoneBox = _.times(iLeadingNoneCount).map(() => this.getBoxObject({ classNames: '' })) ?? [];
        const aTrailingNoneBox = _.times(iTrailingNoneCount).map(() => this.getBoxObject({ classNames: '' })) ?? [];
        const aDayBox = _.map(aPlanData, (o, i) =>
          this.getBoxObject({
            day: moment(o.Datum).format('YYYYMMDD'),
            label: _.toString(i + 1),
            holiday: _.isEqual(o.Offyn, 'X') ? 'Holiday' : 'None',
            classNames: _.isEqual(o.Extyn, 'X') ? 'Type04' : '',
            borderNames: moment().isSame(moment(o.Datum), 'date') ? 'Today' : 'None',
          })
        );

        return [
          ...aLeadingNoneBox, //
          ...aDayBox,
          ...aTrailingNoneBox,
        ];
      },

      async loadCalendarData() {
        const oViewModel = this.getViewModel();

        try {
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const dTyymm = moment(mSearchConditions.Tyymm);
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'DailyTimeExist', {
            ..._.pick(mSearchConditions, ['Werks', 'Orgeh']),
            BegdaS: dTyymm.startOf('month').hours(9).toDate(),
            EnddaS: dTyymm.endOf('month').hours(9).toDate(),
          });

          oViewModel.setProperty('/isLoaded', true);
          oViewModel.setProperty('/calendar/raw', aResults ?? []);
        } catch (oError) {
          throw oError;
        }
      },

      async loadDetailReasonData(sDay) {
        const oViewModel = this.getViewModel();

        try {
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const dTyymm = moment(mSearchConditions.Tyymm);
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'TimeReasonList', {
            Mobile: 'X',
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            BegdaS: _.isEmpty(sDay) ? dTyymm.startOf('month').hours(9).toDate() : moment(sDay).hours(9).toDate(),
            EnddaS: _.isEmpty(sDay) ? dTyymm.endOf('month').hours(9).toDate() : moment(sDay).hours(9).toDate(),
            ..._.pick(mSearchConditions, ['Werks', 'Orgeh']),
          });

          oViewModel.setProperty('/detail/displayDate', _.isEmpty(sDay) ? dTyymm.format('YYYY.MM') : moment(sDay).format('YYYY.MM.DD'));
          oViewModel.setProperty('/detail/list', _.map(aResults, (o) => _.omit(o, '__metadata')) ?? []);
        } catch (oError) {
          throw oError;
        }
      },

      onPressSearch() {
        this.setContentsBusy(true, ['Button', 'Calendar']);
        this.setCalendarYearMonthLabel();

        setTimeout(() => this.retrieveCalendar(), 0);
      },

      isCurrentMonth() {
        const oViewModel = this.getViewModel();
        const sTyymm = oViewModel.getProperty('/searchConditions/Tyymm');

        return moment(sTyymm).isSame(moment(), 'month');
      },

      async retrieveCalendar() {
        try {
          const sDay = this.isCurrentMonth() ? moment().format('YYYYMMDD') : null;

          await Promise.all([
            this.loadCalendarData(), //
            this.loadDetailReasonData(sDay),
          ]);

          this.buildCalendar();
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > retrieveCalendar Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Calendar']);
        }
      },

      async onChangeWerks(oEvent) {
        const oViewModel = this.getViewModel();

        this.setContentsBusy(true, 'Orgeh');

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oEvent.getParameter('changedItem').getKey(),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh'], ''));
          oViewModel.setProperty(
            '/entry/Orgeh',
            _.map(aOrgehEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'Orgeh');
        }
      },

      onPressPrevMonth() {
        const oViewModel = this.getViewModel();
        const sCurrentYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/searchConditions/Tyymm', moment(sCurrentYearMonth).subtract(1, 'months').format('YYYYMM'));

        this.onPressSearch();
      },

      onPressNextMonth() {
        const oViewModel = this.getViewModel();
        const sCurrentYearMonth = oViewModel.getProperty('/searchConditions/Tyymm');

        oViewModel.setProperty('/searchConditions/Tyymm', moment(sCurrentYearMonth).add(1, 'months').format('YYYYMM'));

        this.onPressSearch();
      },

      async onPressYearMonth() {
        try {
          this.setContentsBusy(true, 'Detail');
          this.toggleGridHighlight();

          await this.loadDetailReasonData();
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > onPressYearMonth Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'Detail');
        }
      },

      navToIndividualAttendance(oEvent) {
        try {
          const mRowData = oEvent.getParameter('listItem').getBindingContext().getObject();
          const dCurrentYearMonth = moment(this.getViewModel().getProperty('/searchConditions/Tyymm'));

          this.getRouter().navTo('mobile/individualWorkState', {
            pernr: mRowData.Pernr,
            year: dCurrentYearMonth.get('year'),
            month: dCurrentYearMonth.get('month'),
          });
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > navToIndividualAttendance Error', oError);

          AppUtils.handleError(oError);
        }
      },

      async onClickDay(oEvent) {
        try {
          const oSource = oEvent.getSource();
          const mItemObject = oSource.getBindingContext().getObject();

          if (_.isEqual(mItemObject.day, 'NONE')) return;

          if (_.isEqual(mItemObject.classNames, 'Type04')) {
            this.setContentsBusy(true, 'Detail');
            this.toggleGridHighlight(mItemObject.day);

            await this.loadDetailReasonData(mItemObject.day);
          }
        } catch (oError) {
          this.debug('Controller > mobile teamCalendar > onClickDay Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'Detail');
        }
      },

      toggleGridHighlight(sDay) {
        const oViewModel = this.getViewModel();
        const aPlans = oViewModel.getProperty('/calendar/plans');

        _.chain(aPlans).find({ borderNames: 'Today' }).set('borderNames', 'None').commit();
        if (!_.isEmpty(sDay)) _.chain(aPlans).find({ day: sDay }).set('borderNames', 'Today').commit();

        oViewModel.refresh();
      },
    });
  }
);
