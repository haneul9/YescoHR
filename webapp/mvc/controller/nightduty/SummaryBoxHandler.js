sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    SelectionMode,
    AppUtils,
    BoxHandler,
    ComboEntry,
    ODataReadError,
    ServiceNames
  ) => {
    'use strict';

    return BoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.SummaryBoxHandler', {
      /**
       * @override
       */
      init() {
        this.oCurrentListDialog = null;
        this.sCurrentListTableId = 'currentListTable';
        this.YYYY = this.oController.getSessionProperty('DTFMTYYYY');
        this.YYYYMM = this.oController.getSessionProperty('DTFMTYYYYMM');

        const oTodayMoment = moment().hours(9);
        this.sThisYear = oTodayMoment.format(this.YYYY);
        this.sThisMonth = oTodayMoment.format(this.YYYYMM);

        this.oBoxModel.setData({
          summary: {
            busy: true,
            year: this.sThisYear,
            yearMonth: this.oController.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
          },
          dialog: {
            busy: true,
            yearMonth: this.sThisMonth,
            selectedDutyGroup: 'ALL',
            dutyGroups: new ComboEntry({
              aEntries: [
                { code: 'A', text: 'A' },
                { code: 'B', text: 'B' },
              ],
            }),
            currentList: null,
            currentListRowCount: 1,
            currentListMode: SelectionMode.None,
          },
        });
        this.oController.byId('summaryBox').setModel(this.oBoxModel).bindElement('/summary');

        this.showSummaryData();
      },

      /**
       * 나의 당직근무 정보 조회
       */
      async showSummaryData() {
        try {
          this.setBusy('/summary/busy', true);

          const aResultsData = await this.readSummaryData();

          const mSummaryData = aResultsData[0] || {};
          if (mSummaryData.__metadata) {
            delete mSummaryData.__metadata;
          }

          this.setSummaryData(mSummaryData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty List > SummaryBoxHandler.showSummaryData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy('/summary/busy', false);
        }
      },

      /**
       *
       * @returns
       */
      async readSummaryData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallSummarySet';
          const sPernr = this.oController.getAppointeeProperty('Pernr');

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param {object} mSummaryData
       */
      setSummaryData(summaryData = {}) {
        this.oBoxModel.setData({ summary: summaryData }, true);
      },

      /**
       * @override
       */
      async onPressIcon() {
        this.setBusy('/summary/busy', true);

        if (!this.oCurrentListDialog) {
          this.oCurrentListDialog = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.nightduty.fragment.CurrentListDialog',
            controller: this,
          });

          this.oController.getView().addDependent(this.oCurrentListDialog);
          this.oCurrentListDialog
            .setModel(this.oBoxModel)
            .bindElement('/dialog')
            .attachBeforeOpen(() => {
              this.initCurrentListSearchConditions();
              this.onPressCurrentListSearch();
            })
            .attachAfterClose(() => {
              this.clearDialog();
            });
        }

        this.oCurrentListDialog.open();

        this.setBusy('/summary/busy', false);
      },

      /**
       *
       */
      onPressDialogClose() {
        this.oCurrentListDialog.close();
      },

      /**
       *
       */
      initCurrentListSearchConditions() {
        this.oBoxModel.setProperty('/dialog/yearMonth', this.sThisMonth);
        this.oBoxModel.setProperty('/dialog/selectedDutyGroup', 'ALL');
      },

      /**
       * 나의 당직근무 - 당직근무현황 조회 아이콘 press event handler
       */
      async onPressCurrentListSearch() {
        try {
          this.oBoxModel.setProperty('/dialog/busy', true);

          const aCurrentListTableData = await this.readCurrentListTableData();

          this.setCurrentListTableData(aCurrentListTableData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty Summary > Dialog > onPressCurrentListSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.oBoxModel.setProperty('/dialog/busy', false);
        }
      },

      async readCurrentListTableData() {
        return new Promise((resolve, reject) => {
          const sPernr = this.oController.getAppointeeProperty('Pernr');
          const sYearMonth = this.oBoxModel.getProperty('/dialog/yearMonth').replace(/\D/g, '');
          const aFilters = [
            new Filter('Pernr', FilterOperator.EQ, sPernr), //
            new Filter('Begmm', FilterOperator.EQ, sYearMonth),
            new Filter('Endmm', FilterOperator.EQ, sYearMonth),
          ];

          const sSelectedDutyGroup = this.oBoxModel.getProperty('/dialog/selectedDutyGroup').replace(/ALL/g, '');
          if (sSelectedDutyGroup) {
            aFilters.push(new Filter('Ocshf', FilterOperator.EQ, sSelectedDutyGroup));
          }

          const sUrl = '/OnCallListSet';
          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: aFilters,
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      setCurrentListTableData(currentListData = []) {
        this.oBoxModel.setProperty('/dialog/currentList', currentListData);
        this.oBoxModel.setProperty('/dialog/currentListRowCount', currentListData.length || 1);
      },

      onChangeRowSelection() {},

      clearDialog() {
        this.oBoxModel.setProperty('/dialog/currentList', []);
      },
    });
  }
);
