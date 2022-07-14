/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/talentDev/TalentDevDialogHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    FileDataProvider,
    Client,
    ServiceManager,
    ServiceNames,
    BaseController,
    TalentDevDialogHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talentDev.Main', {
      mSelectedCommitteeData: null,

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
            Employee: false,
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
              rows: [],
              rowCount: 1,
              totalCount: 0,
              readyCount: 0,
              progressCount: 0,
              completeCount: 0,
            },
          },
          employee: {
            listInfo: {
              rows: [],
              rowCount: 1,
              totalCount: 0,
              readyCount: 0,
              progressCount: 0,
              completeCount: 0,
              infoMessage: this.getBundleText('MSG_43001'), // 조회 조건에 따른 대상자입니다.
            },
            auth: {
              retrieval: false,
              change: false,
            },
          },
        };
      },

      async onObjectMatched() {
        this.setContentsBusy(true);

        try {
          const oViewModel = this.getViewModel();
          oViewModel.setSizeLimit(10000);

          this.oTalentDevDialogHandler = new TalentDevDialogHandler(this);

          await this.initializeSearchConditions();

          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          await this.retrieve({ ...mSearchConditions, Mode: '1' });
        } catch (oError) {
          this.debug('Controller > talentDev > onObjectMatched Error', oError);

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
          const [aPersaEntry, aOrgehEntry, aGjahrEntry, aZseqnrEntry, [mAuth]] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetGjahrList', { Werks: sParamWerks }),
            Client.getEntitySet(oTalentModel, 'GetZseqnrList', { Werks: sParamWerks, Gjahr: sGjahr }),
            Client.getEntitySet(oTalentModel, 'TalentDevAuth'),
          ]);

          oViewModel.setProperty('/employee/auth', _.chain(mAuth).omit('__metadata').value());
          oViewModel.setProperty('/searchConditions', {
            Werks: sParamWerks,
            Orgeh: _.some(aOrgehEntry, (o) => o.Orgeh === Orgeh) ? Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']),
            Pernr: '',
            Ename: '',
            Gjahr: sGjahr,
            Zseqnr: _.get(aZseqnrEntry, [0, 'Zseqnr']),
          });

          this.setComboEntry(oViewModel, '/entry/Werks', aPersaEntry);
          this.setComboEntry(oViewModel, '/entry/Orgeh', aOrgehEntry);
          this.setComboEntry(oViewModel, '/entry/Gjahr', aGjahrEntry);
          this.setComboEntry(oViewModel, '/entry/Zseqnr', aZseqnrEntry);

          // File upload URL
          oViewModel.setProperty('/uploadUrl', `${ServiceManager.getServiceUrl(ServiceNames.COMMON)}/FileUploadSet`);
        } catch (oError) {
          this.debug('Controller > talentDev > initializeSearchConditions Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);
        }
      },

      setComboEntry(oViewModel, sPath, aEntry) {
        oViewModel.setProperty(
          sPath,
          _.map(aEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
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

      async retrieve(mPayload) {
        const { Mode, Ztitle, Gjahr, Zseqnrtx } = mPayload;
        const oViewModel = this.getViewModel();

        this.byId('committeeTable').clearSelection();
        this.byId('employeeTable').clearSelection();

        try {
          if (Mode === '1') {
            mPayload.TalentDevCommitteeSet = [];
          }
          mPayload.TalentDevTargetSet = [];

          const aData = await Client.deep(this.getModel(ServiceNames.TALENT), 'TalentDev', mPayload);

          if (Mode === '1') {
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
              rows: aCommitteeList,
              rowCount: Math.min(Math.max(aCommitteeList.length, 1), 3),
              totalCount: aCommitteeList.length,
              readyCount: mCommitteeCount['0'],
              progressCount: mCommitteeCount['1'],
              completeCount: mCommitteeCount['2'],
            });

            this.mSelectedCommitteeData = aCommitteeList[0] || {};
          }

          const aEmployeeList = _.map(aData.TalentDevTargetSet.results, (o) =>
            _.chain(o)
              .omit('__metadata')
              .update('Zstat', (sZstat) => (_.chain(sZstat).parseInt().isNaN().value() ? '0' : sZstat))
              .value()
          );
          const mEmployeeCount = _.chain(aEmployeeList)
            .map('Zstat')
            .countBy()
            .defaults({ ['0']: 0, ['1']: 0, ['2']: 0 })
            .value();
          const sInfoMessage = Mode === '2' ? this.getBundleText('MSG_43002', Ztitle, Gjahr, Zseqnrtx) : this.getBundleText('MSG_43001'); // {0} {1}년 {3}차 대상자 입니다. : 조회 조건에 따른 대상자입니다.
          oViewModel.setProperty('/employee/listInfo', {
            rows: aEmployeeList,
            rowCount: Math.min(Math.max(aEmployeeList.length, 1), 10),
            totalCount: aEmployeeList.length,
            readyCount: mEmployeeCount['0'],
            progressCount: mEmployeeCount['1'],
            completeCount: mEmployeeCount['2'],
            infoMessage: sInfoMessage,
          });
        } catch (oError) {
          this.debug('Controller > talentDev > retrieve Error', oError);

          const mInitData = {
            rows: [],
            rowCount: 1,
            totalCount: 0,
            readyCount: 0,
            progressCount: 0,
            completeCount: 0,
          };
          oViewModel.setProperty('/committee/listInfo', mInitData);
          oViewModel.setProperty('/employee/listInfo', { ...mInitData, infoMessage: this.getBundleText('MSG_43001') }); // 조회 조건에 따른 대상자입니다.

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Committee', 'Employee']);
        }
      },

      async onChangeWerks() {
        this.setContentsBusy(true, ['Orgeh', 'Gjahr', 'Zseqnr', 'Button']);

        const oViewModel = this.getViewModel();
        const sWerks = oViewModel.getProperty('/searchConditions/Werks');

        this.initializeSearchConditions(sWerks);
      },

      onEmployeeSearchOpen() {
        this.getEmployeeSearchDialogHandler()
          .setOnLoadSearch(this.getEmployeeSearchDialogOnLoadSearch()) // Open 후 조회 여부 - 각 화면에서 구현
          .setOptions(this.getEmployeeSearchDialogCustomOptions()) // Fields 활성화여부 및 초기 선택값 - 각 화면에서 구현
          .setCallback(this.callbackAppointeeChange.bind(this)) // 선택 후 실행 할 Function - 각 화면에서 구현
          .openDialog();
      },

      getEmployeeSearchDialogOnLoadSearch() {
        return false;
      },

      getEmployeeSearchDialogCustomOptions() {
        const oViewModel = this.getViewModel();
        const { Werks, Orgeh } = oViewModel.getProperty('/searchConditions');
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

      async onPressSearch() {
        this.setContentsBusy(true, ['Button', 'Committee', 'Employee']);

        const mSearchConditions = this.getViewModel().getProperty('/searchConditions');
        await this.retrieve({ ...mSearchConditions, Mode: '1' });
      },

      onPressCommitteeExcelDownload() {
        this.setContentsBusy(true, 'Button');
        const oTable = this.byId('committeeTable');
        const sFileName = this.getBundleText('LABEL_43001'); // 인재육성위원회

        this.TableUtils.export({ oTable, sFileName });
        this.setContentsBusy(false, 'Button');
      },

      onPressEmployeeExcelDownload() {
        this.setContentsBusy(true, 'Button');
        const oTable = this.byId('employeeTable');
        const sFileName = `${this.getBundleText('LABEL_43001')}_${this.getBundleText('LABEL_43002')}`; // 인재육성위원회_대상자

        this.TableUtils.export({ oTable, sFileName });
        this.setContentsBusy(false, 'Button');
      },

      async onSelectCommitteeTableRow(oEvent) {
        const mRowData = oEvent.getParameter('rowBindingContext').getProperty();
        this.mSelectedCommitteeData = { ...mRowData, Mode: '2' };
        await this.retrieve(this.mSelectedCommitteeData);
      },

      async onSelectEmployeeTableRow(oEvent) {
        const { Pernr, Gjahr, Zseqnr, FileupChk } = oEvent.getParameter('rowBindingContext').getProperty();
        const { Mdate } = this.mSelectedCommitteeData;

        setTimeout(() => {
          const AuthChange = this.getViewModel().getProperty('/employee/auth/AuthChange');
          this.oTalentDevDialogHandler //
            .setCallback(async () => {
              await this.retrieve({ ...this.mSelectedCommitteeData, Mode: '2' });
            })
            .openDialog({ Pernr, Gjahr, Mdate, Zseqnr, FileupChk, AuthChange });
        });
      },

      async onPressFileDownload(oEvent) {
        const mFile = await FileDataProvider.readData(oEvent.getSource().data('appno'), 9050);
        this.AttachFileAction.openFileLink(mFile.Fileuri);
      },

      onPressFileUpload() {},

      onPressFileDelete() {},

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 1:
            return sap.ui.core.IndicationColor.Indication02;
          case 2:
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return sap.ui.core.IndicationColor.None;
        }
      },
    });
  }
);
