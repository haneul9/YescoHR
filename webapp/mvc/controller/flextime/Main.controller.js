/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.Main', {
      sAccty: 'E',

      initializeModel() {
        return {
          initBeguz: moment('0900', 'hhmm').toDate(),
          initEnduz: moment('1800', 'hhmm').toDate(),
          busy: {
            Button: false,
            Dialog: false,
            Input: false,
            Summary: false,
            Details: false,
          },
          summary: {
            rowCount: 1,
            list: [
              { Zyymm: moment().format('YYYYMM'), Caldays: '31', Wrkdays: '22', Bastim: '177', Ctrtim: '196', Daytim: '194', Gaptim: '-2', Wekavg: '48.50', Statxt: '계약근로시간 미달', Stacol: '2', Clsda: moment('20220405').toDate() }, //
            ],
          },
          details: {
            rowCount: 9,
            list: [
              { Offyn: 'X', Datum: moment('20220301').toDate(), Daytx: '화', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '8.00', Stdazc: '8.00', Brk01m: '1.00', Notes: '', Erryn: '' }, //
              { Offyn: '', Datum: moment('20220302').toDate(), Daytx: '수', Atext: '', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('1800', 'hhmm').toDate(), Brk01: '1.00', Brk02: '0.00', Reltim: '8.00', Paytim: '', Stdazc: '16.00', Brk01m: '1.00', Notes: '', Erryn: '' },
              { Offyn: 'X', Datum: moment('20220303').toDate(), Daytx: '목', Atext: '연차', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '8.00', Stdazc: '24.00', Brk01m: '', Notes: '', Erryn: '' },
              { Offyn: '', Datum: moment('20220304').toDate(), Daytx: '금', Atext: '', Beguz: moment('1000', 'hhmm').toDate(), Enduz: moment('1500', 'hhmm').toDate(), Brk01: '1.00', Brk02: '0.00', Reltim: '4.50', Paytim: '', Stdazc: '28.50', Brk01m: '0.50', Notes: '', Erryn: '' },
              { Offyn: 'X', Datum: moment('20220305').toDate(), Daytx: '토', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '', Stdazc: '28.50', Brk01m: '', Notes: '', Erryn: '' },
              { Offyn: 'X', Datum: moment('20220306').toDate(), Daytx: '일', Atext: '', Beguz: null, Enduz: null, Brk01: '', Brk02: '', Reltim: '', Paytim: '', Stdazc: '28.50', Brk01m: '', Notes: '', Erryn: '' },
              { Offyn: '', Datum: moment('20220307').toDate(), Daytx: '월', Atext: '', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('2130', 'hhmm').toDate(), Brk01: '0.50', Brk02: '0.00', Reltim: '12.00', Paytim: '', Stdazc: '40.00', Brk01m: '1.00', Notes: '필수휴게시간 미달', Erryn: 'X' },
              { Offyn: '', Datum: moment('20220308').toDate(), Daytx: '화', Atext: '반차(오전)', Beguz: moment('1400', 'hhmm').toDate(), Enduz: moment('1800', 'hhmm').toDate(), Brk01: '0.00', Brk02: '0.00', Reltim: '4.00', Paytim: '4.00', Stdazc: '48.00', Brk01m: '0.00', Notes: '시작시간 13시부터 가능', Erryn: '' },
              { Offyn: '', Datum: moment('20220309').toDate(), Daytx: '수', Atext: '반차(오후)', Beguz: moment('0900', 'hhmm').toDate(), Enduz: moment('1300', 'hhmm').toDate(), Brk01: '0.00', Brk02: '0.00', Reltim: '4.00', Paytim: '4.00', Stdazc: '52.00', Brk01m: '0.00', Notes: '종료시간 14시까지 가능', Erryn: '' },
            ],
            breakTime: [],
          },
          dialog: {
            targetDates: [],
            work: { rowCount: 1, list: [] },
            legal: { rowCount: 1, list: [] },
            extra: { rowCount: 4, list: [] },
          },
        };
      },

      async callbackAppointeeChange() {
        try {
          this.setContentsBusy(true, ['Summary', 'Details', 'Button']);

          const sZyymm = this.getViewModel().getProperty('/summary/list/0/Zyymm');

          await Promise.all([
            this.readFlextimeSummary(sZyymm), //
            this.readFlextimeDetails(sZyymm),
          ]);

          this.setDetailsTableRowColor();
        } catch (oError) {
          this.debug('Controller > flextime > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
        }
      },

      async onObjectMatched() {
        try {
          this.setContentsBusy(true);

          this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

          // await Promise.all([
          //   this.readFlextimeSummary(), //
          //   this.readFlextimeDetails(),
          // ]);

          this.setTableColor();
          this.setDetailsTableRowColor();
          this.initializeInputDialog();
        } catch (oError) {
          this.debug('Controller > flextime > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async readFlextimeSummary(sZyymm) {
        try {
          const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
            Actty: this.sAccty,
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sYearMonth,
          });

          this.getViewModel().setProperty('/summary/rowCount', 1);
          this.getViewModel().setProperty('/summary/list', [_.get(aResults, 0, { Zyymm: sYearMonth })]);
        } catch (oError) {
          throw oError;
        }
      },

      async readFlextimeDetails(sZyymm) {
        try {
          const sYearMonth = _.isEmpty(sZyymm) ? moment().format('YYYYMM') : sZyymm;
          const mPayload = {
            Werks: this.getAppointeeProperty('Werks'),
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sYearMonth,
          };
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeDetail', { ..._.omit(mPayload, 'Werks') });

          this.getViewModel().setProperty('/details/rowCount', aResults.length ?? 0);
          this.getViewModel().setProperty('/details/list', aResults ?? []);
          this.getViewModel().setProperty(
            '/details/breakTime',
            _.map(aResults, (o) => ({
              ...mPayload,
              Datum: o.Datum,
              Datumtx: moment(o.Datum).format('YYYYMMDD'),
              Beguz: '',
              Enduz: '',
              Pbeg0: '',
              Pend0: '',
              Pbeg1: '',
              Pend1: '',
              Pbeg2: '',
              Pend2: '',
              Pbeg3: '',
              Pend3: '',
              Anzb0: '',
              Anzb1: '',
              Anzb2: '',
              Anzb3: '',
              Resn1: '',
              Resn2: '',
              Resn3: '',
            }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      setTableColor() {
        const oSummaryTable = this.byId('flextimeSummaryTable');

        setTimeout(() => {
          this.TableUtils.setColorColumn({ oTable: oSummaryTable, mColorMap: { 3: 'bgType10', 4: 'bgType10', 5: 'bgType11', 6: 'bgType11', 7: 'bgType12' } });
        }, 100);
      },

      setDetailsTableRowColor() {
        setTimeout(() => {
          const oDetailsTable = this.byId('flextimeDetailsTable');

          oDetailsTable.getRows().forEach((row) => {
            const mRowData = row.getBindingContext().getObject();

            if (mRowData.Erryn === 'X') {
              row.addStyleClass('row-error');
            } else {
              row.removeStyleClass('row-error');
            }

            if (mRowData.Checked) {
              row.addStyleClass('row-select');
            } else {
              row.removeStyleClass('row-select');
            }
          });
        }, 100);
      },

      onSelectionDetailsTable(oEvent) {
        const oViewModel = this.getViewModel();
        const aDetailsList = oViewModel.getProperty('/details/list');
        const aSelectedIndices = oEvent.getSource().getSelectedIndices();

        _.forEach(aDetailsList, (o, i) => _.set(o, 'Checked', _.includes(aSelectedIndices, i)));
        oViewModel.refresh();

        this.setDetailsTableRowColor();
      },

      async initializeInputDialog() {
        const oView = this.getView();

        this._oTimeInputDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.flextime.fragment.TimeInputDialog',
          controller: this,
        });

        this._oTimeInputDialog.attachBeforeOpen(async () => {
          const oViewModel = this.getViewModel();
          const aTargetDates = oViewModel.getProperty('/dialog/targetDates');
          const sSumLabel = this.getBundleText('LABEL_00172'); // 합계

          if (aTargetDates.length === 1) {
            const dDate = moment(aTargetDates[0]).hours(9);
            const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeBreak', {
              Pernr: this.getAppointeeProperty('Pernr'),
              Zyymm: dDate.format('YYYYMM'),
              Datum: dDate.toDate(),
            });

            oViewModel.setProperty('/dialog/work/list', [{}]);
            oViewModel.setProperty('/dialog/legal/list', [{ Beguz: _.get(mResult, 'Pbeg0'), Enduz: _.get(mResult, 'Pend0'), Anzb: _.get(mResult, 'Anzb0'), Brk01m: _.get(mResult, 'Brk01m') }]);
            oViewModel.setProperty('/dialog/extra/list', [
              { Beguz: _.get(mResult, 'Pbeg1'), Enduz: _.get(mResult, 'Pend1'), Anzb: _.get(mResult, 'Anzb1'), Resn: _.get(mResult, 'Resn1'), Sumrow: false }, //
              { Beguz: _.get(mResult, 'Pbeg2'), Enduz: _.get(mResult, 'Pend2'), Anzb: _.get(mResult, 'Anzb2'), Resn: _.get(mResult, 'Resn2'), Sumrow: false },
              { Beguz: _.get(mResult, 'Pbeg3'), Enduz: _.get(mResult, 'Pend3'), Anzb: _.get(mResult, 'Anzb3'), Resn: _.get(mResult, 'Resn3'), Sumrow: false },
              {
                Beguz: sSumLabel,
                Enduz: sSumLabel,
                Anzb: _.chain(mResult)
                  .pick(['Pend1', 'Pend2', 'Pend3'])
                  .values()
                  .sumBy((d) => _.toNumber(d))
                  .toString()
                  .value(),
                Resn: '',
                Sumrow: true,
              },
            ]);
          } else if (aTargetDates.length > 1) {
            oViewModel.setProperty('/dialog/work/list', [{ Beguz: '0900', Enduz: '1800' }]);
            oViewModel.setProperty('/dialog/legal/list', [{ Beguz: '1200', Enduz: '1300', Anzb: '1.00', Brk01m: '1.00' }]);
            oViewModel.setProperty('/dialog/extra/list', [
              { Beguz: '', Enduz: '', Anzb: '', Resn: '', Sumrow: false }, //
              { Beguz: '', Enduz: '', Anzb: '', Resn: '', Sumrow: false },
              { Beguz: '', Enduz: '', Anzb: '', Resn: '', Sumrow: false },
              { Beguz: sSumLabel, Enduz: sSumLabel, Anzb: '0', Resn: '', Sumrow: true },
            ]);
          }
        });

        oView.addDependent(this._oTimeInputDialog);

        this.TableUtils.summaryColspan({ oTable: this.byId('flextimeExtraTable'), aHideIndex: [1] });
      },

      async onChangeMonth(oEvent) {
        try {
          this.setContentsBusy(true, ['Summary', 'Details', 'Button']);

          const sZyymm = oEvent.getParameter('value');

          await Promise.all([
            this.readFlextimeSummary(sZyymm), //
            this.readFlextimeDetails(sZyymm),
          ]);

          this.setDetailsTableRowColor();
        } catch (oError) {
          this.debug('Controller > flextime > onChangeMonth Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Summary', 'Details', 'Button']);
        }
      },

      onDiffTime(oEvent) {
        const oRowBindingContext = oEvent.getSource().getBindingContext();
        const mRowData = oRowBindingContext.getObject();
        const sPath = oRowBindingContext.getPath();
        const sTimeFormat = 'hhmm';

        if (_.isEmpty(mRowData.Beguz) || _.isEmpty(mRowData.Enduz)) {
          _.set(mRowData, 'Anzb', '');
        } else {
          _.set(
            mRowData,
            'Anzb',
            _.toString(
              moment
                .duration(moment(mRowData.Enduz, sTimeFormat).diff(moment(mRowData.Beguz, sTimeFormat)))
                .abs()
                .asHours()
            )
          );
        }

        if (_.startsWith(sPath, '/dialog/extra')) this.calcExtraTimeSum();
      },

      calcExtraTimeSum() {
        const oViewModel = this.getViewModel();
        const aExtraList = oViewModel.getProperty('/dialog/extra/list');

        oViewModel.setProperty('/dialog/extra/list/3/Anzb', _.chain(aExtraList).take(3).mapValues('Anzb').values().compact().sumBy(_.toNumber).toString().value());
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

      helpInput(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/dialog/targetDates', [oEvent.getSource().getBindingContext().getObject().Datum]);

        this._oTimeInputDialog.open();
      },

      onPressBatchButton() {
        const oViewModel = this.getViewModel();
        const aDetailsList = oViewModel.getProperty('/details/list');
        const aSelectedIndices = this.byId('flextimeDetailsTable').getSelectedIndices();

        if (aSelectedIndices.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_40002')); // 일괄입력할 일자를 두 건 이상 선택하여 주십시오.
          return;
        }

        oViewModel.setProperty(
          '/dialog/targetDates',
          _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d, 'Datum']))
        );

        this._oTimeInputDialog.open();
      },

      onPressDialogConfirm() {},

      async createProcess(dDatum) {
        const oViewModel = this.getViewModel();

        try {
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary/list/0'));
          const aDetails = _.cloneDeep(oViewModel.getProperty('/details/list'));
          const aBreakTimes = _.cloneDeep(oViewModel.getProperty('/details/breakTime'));

          if (!_.isEmpty(value)) {
            aDetails = _.filter(aDetails, { Datum: dDatum });
            aBreakTimes = _.filter(aBreakTimes, { Datum: dDatum });
          }

          return await Client.deep(this.getModel(ServiceNames.WORKTIME), 'FlexTimeSummary', {
            ...mSummary,
            Accty: this.sAccty,
            Pernr: this.getAppointeeProperty('Pernr'),
            AssoFlexTimeDetailSet: aDetails,
            AssoFlexTimeBreakSet: aBreakTimes,
          });
        } catch (oError) {
          throw oError;
        }
      },
    });
  }
);
