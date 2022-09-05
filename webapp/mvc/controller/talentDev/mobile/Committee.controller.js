/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/mobile/EmployeePopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    BaseController,
    EmployeePopoverHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talentDev.mobile.Committee', {
      initializeModel() {
        return {
          busy: {
            Werks: false,
            Orgeh: false,
            Pernr: false,
            Gjahr: false,
            Zseqnr: false,
            Button: false,
            Committee: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
            Gjahr: [],
            Zseqnr: [],
          },
          searchConditions: {
            Werks: '',
            Orgeh: '',
            Pernr: '',
            Ename: '',
            Gjahr: '',
            Zseqnr: '',
          },
          committee: {
            listInfo: {
              list: [],
              rowCount: 1,
              totalCount: 0,
              readyCount: 0,
              progressCount: 0,
              completeCount: 0,
            },
          },
        };
      },

      async onObjectMatched() {
        this.setContentsBusy(true);

        try {
          this.oEmployeePopoverHandler = new EmployeePopoverHandler(this);

          const oViewModel = this.getViewModel();
          oViewModel.setSizeLimit(10000);

          await this.initializeSearchConditions();

          this.retrieve(true);
        } catch (oError) {
          this.debug('Controller > mobile talentDev > onObjectMatched Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async initializeSearchConditions(sWerks) {
        const oViewModel = this.getViewModel();

        try {
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const oTalentModel = this.getModel(ServiceNames.TALENT);
          const { Pernr, Werks, Orgeh } = this.getAppointeeData();
          const sParamWerks = sWerks || Werks;
          const sGjahr = moment().format('YYYY');
          const [
            aPersaEntry,
            // aOrgehEntry,
            aGjahrEntry,
            aZseqnrEntry,
          ] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr }), //
            // Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetGjahrList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetZseqnrList', { Werks: sParamWerks, Gjahr: sGjahr }),
          ]);

          oViewModel.setProperty('/searchConditions', {
            Werks: sParamWerks,
            // Orgeh: _.some(aOrgehEntry, (o) => o.Orgeh === Orgeh) ? Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']),
            // Pernr: '',
            // Ename: '',
            Gjahr: sGjahr,
            Zseqnr: 'ALL', // _.get(aZseqnrEntry, [0, 'Zseqnr']), // 모바일만 전체 차수가 모두 조회되도록 변경
          });

          _.forEach(aZseqnrEntry, (m) => (m.Zseqnrtx = `${m.Zseqnrtx}${AppUtils.getBundleText('LABEL_42003')}`)); // 차

          const sChoiceText = AppUtils.getBundleText('LABEL_00268');
          // aOrgehEntry.unshift({ Orgeh: 'ALL', Orgtx: sChoiceText });
          aGjahrEntry.unshift({ Gjahr: 'ALL', Gjahrtx: sChoiceText });
          aZseqnrEntry.unshift({ Zseqnr: 'ALL', Zseqnrtx: sChoiceText });

          this.setComboEntry(oViewModel, '/entry/Werks', aPersaEntry);
          // this.setComboEntry(oViewModel, '/entry/Orgeh', aOrgehEntry);
          this.setComboEntry(oViewModel, '/entry/Gjahr', aGjahrEntry);
          this.setComboEntry(oViewModel, '/entry/Zseqnr', aZseqnrEntry);

          oViewModel.setProperty('/committee/listInfo', {
            list: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
          });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > initializeSearchConditions Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);
        }
      },

      setComboEntry(oViewModel, sPath, aEntry) {
        oViewModel.setProperty(
          sPath,
          _.map(aEntry, (o) => _.chain(o).omit('__metadata').value())
        );
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

      async retrieve(bOnloadSearch = true) {
        const oViewModel = this.getViewModel();

        try {
          const mSearchConditions = this.getSearchConditions(oViewModel);
          const mPayload = { ...mSearchConditions, Mode: '1', TalentDevCommitteeSet: [] };
          const aData = await Client.deep(this.getModel(ServiceNames.TALENT), 'TalentDev', mPayload);

          const aCommitteeList = _.map(aData.TalentDevCommitteeSet.results, (o) =>
            _.chain(o)
              .omit('__metadata')
              .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
              .value()
          );
          const mCommitteeCount = _.chain(aCommitteeList)
            .map('Zstat')
            .countBy()
            .defaults({ ['0']: 0, ['1']: 0, ['2']: 0 })
            .value();
          oViewModel.setProperty('/committee/listInfo', {
            list: aCommitteeList,
            rowCount: Math.min(Math.max(aCommitteeList.length, 1), 3),
            totalCount: aCommitteeList.length,
            readyCount: mCommitteeCount['0'],
            progressCount: mCommitteeCount['1'],
            completeCount: mCommitteeCount['2'],
          });
        } catch (oError) {
          this.debug('Controller > mobile talentDev > retrieve Error', oError);

          oViewModel.setProperty('/committee/listInfo', {
            list: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
          });

          if (bOnloadSearch && oError.code === 'A') {
            return;
          }
          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Committee']);
        }
      },

      getSearchConditions(oViewModel) {
        return _.chain(oViewModel.getProperty('/searchConditions'))
          .cloneDeep()
          .update('Orgeh', (sOrgeh) => (sOrgeh === 'ALL' ? '' : sOrgeh))
          .update('Gjahr', (sGjahr) => (sGjahr === 'ALL' ? '' : sGjahr))
          .update('Zseqnr', (sZseqnr) => (sZseqnr === 'ALL' ? '' : sZseqnr))
          .value();
      },

      onChangeWerks() {
        this.setContentsBusy(true, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);

        const oViewModel = this.getViewModel();
        const sWerks = oViewModel.getProperty('/searchConditions/Werks');

        this.initializeSearchConditions(sWerks);
      },

      async onChangeGjahr() {
        this.setContentsBusy(true, ['Zseqnr', 'Button']);

        try {
          const oViewModel = this.getViewModel();
          const { Werks, Gjahr } = this.getSearchConditions(oViewModel);

          const aZseqnrEntry = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'GetZseqnrList', { Werks, Gjahr });

          oViewModel.setProperty('/searchConditions/Zseqnr', 'ALL');
          aZseqnrEntry.unshift({ Zseqnr: 'ALL', Zseqnrtx: this.getBundleText('LABEL_00268') });
          this.setComboEntry(oViewModel, '/entry/Zseqnr', aZseqnrEntry);
        } catch (oError) {
          this.debug('Controller > talentDev > onChangeGjahr Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Zseqnr', 'Button']);
        }
      },

      onEmployeeSearchOpen() {
        this.getEmployeeSearchDialogHandler()
          .setOnLoadSearch(this.getEmployeeSearchDialogOnLoadSearch()) // Open 후 조회 여부 - 각 화면에서 구현
          .setOptions(this.getEmployeeSearchDialogCustomOptions()) // Fields 활성화여부 및 초기 선택값 - 각 화면에서 구현
          .setCallback(this.callbackAppointeeChange.bind(this)) // 선택 후 실행 할 Function - 각 화면에서 구현
          .openDialog();
      },

      getEmployeeSearchDialogOnLoadSearch() {
        return true;
      },

      getEmployeeSearchDialogCustomOptions() {
        const oViewModel = this.getViewModel();
        const { Werks, Orgeh } = this.getSearchConditions(oViewModel);
        const aOrgehEntry = oViewModel.getProperty('/entry/Orgeh');
        return {
          searchConditions: {
            Persa: Werks.replace(/0000/, ''),
            Orgeh,
            Orgtx: _.find(aOrgehEntry, { Orgeh }).Orgtx,
          },
        };
      },

      callbackAppointeeChange({ Pernr, Ename }) {
        const oViewModel = this.getViewModel();
        oViewModel.setProperty('/searchConditions/Pernr', Pernr);
        oViewModel.setProperty('/searchConditions/Ename', Ename);
      },

      onPressSearch() {
        this.setContentsBusy(true, ['Button', 'Committee']);

        this.retrieve(false);
      },

      async onPressLegend(oEvent) {
        const oControl = oEvent.getSource();

        if (!this.oLegendPopover) {
          const oView = this.getView();

          this.oLegendPopover = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.talentDev.mobile.fragment.LegendPopover',
            controller: this,
          });

          oView.addDependent(this.oLegendPopover);
        }

        this.oLegendPopover.openBy(oControl);
      },

      onPressCommitteeListItem(oEvent) {
        this.setContentsBusy(true, ['Button', 'Committee']);

        const mSelectedCommitteeData = oEvent.getSource().getBindingContext().getProperty();
        this.oEmployeePopoverHandler.setCallback(() => this.retrieve()).openPopover(mSelectedCommitteeData);

        setTimeout(() => this.setContentsBusy(false, ['Button', 'Committee']), 300);
      },
    });
  }
);
