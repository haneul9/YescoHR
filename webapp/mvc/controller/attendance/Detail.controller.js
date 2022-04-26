/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    ComboEntry,
    UI5Error,
    Appno,
    AppUtils,
    DateUtils,
    AttachFileAction,
    Client,
    ServiceNames,
    TableUtils,
    TextUtils,
    Validator,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.Detail', {
      LIST_PAGE_ID: { ESS: 'container-ehr---attendanceList', HASS: 'container-ehr---h_attendanceList' },
      APPTP: 'HR04',
      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },
      ACTION_MESSAGE: {
        T: 'LABEL_00104', // 임시저장
        C: 'LABEL_00121', // 신청
      },

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      getPreviousRouteName() {
        return 'attendance';
      },

      initializeModel() {
        return {
          busy: false,
          previousName: '',
          type: this.PAGE_TYPE.NEW,
          Appno: null,
          ZappStatAl: null,
          form: {
            hasRow: false,
            rowCount: 1,
            listMode: 'MultiToggle',
            list: [],
            dialog: {
              calcCompleted: false,
              selectedRowPath: null,
              awartCodeList: [],
              search: {},
              data: {
                Awart: 'ALL',
              },
              list: [],
            },
          },
          ApplyInfo: {},
          ApprovalDetails: {},
        };
      },

      onObjectMatched(oParameter, sRouteName) {
        if (!'A,B,C'.split(',').includes(oParameter.type)) {
          this.onNavBack();
          return;
        }

        if (oParameter.type === this.PAGE_TYPE.CHANGE) {
          // Multiple table generate
          TableUtils.adjustRowSpan({
            oTable: this.byId('approveMultipleTable'),
            aColIndices: [8],
            sTheadOrTbody: 'thead',
          });
        }

        this.getAppointeeModel().setProperty('/showBarChangeButton', false);

        const oViewModel = this.getView().getModel();
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/type', oParameter.type);
        oViewModel.setProperty('/Appno', oParameter.appno);
        oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

        this.loadPage();
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.appno ? this.getBundleText('LABEL_00100') : ''; // 조회
        const mNavigationMap = {
          A: this.getBundleText('LABEL_04002'), // 신규신청
          B: this.getBundleText('LABEL_04003'), // 변경신청
          C: this.getBundleText('LABEL_04004'), // 취소신청
        };
        return `${mNavigationMap[oArguments.type]} ${sAction}`;
      },

      async loadPage() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');
        const sType = oViewModel.getProperty('/type');

        try {
          if (sAppno) {
            const mFilters = { Prcty: 'R' };

            if (_.isEqual(sAppno, 'NA')) {
              const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.HASS : this.LIST_PAGE_ID.ESS);
              const [mSelectedRowData] = oListView.getModel().getProperty('/parameter/rowData');

              _.chain(mFilters).set('Pernr', mSelectedRowData.Pernr).set('Awart', mSelectedRowData.Awart).set('Begda', mSelectedRowData.Begda).commit();
            } else {
              _.set(mFilters, 'Appno', sAppno);
            }

            const aResultData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveApplEmpList', mFilters);

            oViewModel.setProperty('/ZappStatAl', _.get(aResultData, [0, 'ZappStatAl']));
            oViewModel.setProperty('/form/listMode', 'None');

            this.setTableData({ sType, oViewModel, aRowData: aResultData });
            this.initializeApplyInfoBox(aResultData[0]);
            this.initializeApprovalBox(aResultData[0]);
          } else {
            const aAwartResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'AwartCodeList');

            oViewModel.setProperty('/form/dialog/awartCodeList', new ComboEntry({ codeKey: 'Awart', valueKey: 'Atext', aEntries: aAwartResults }));

            if (_.includes([this.PAGE_TYPE.CHANGE, this.PAGE_TYPE.CANCEL], sType)) this.callDialog(sType);

            this.initializeApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > loadPage Error', oError);

          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo(oViewModel.getProperty('/previousName')),
          });
        }
      },

      setTableData({ sType, oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length);
        oViewModel.setProperty(
          '/form/list',
          aRowData.map((o) => {
            if (sType === this.PAGE_TYPE.CHANGE) {
              return { ...o };
            } else {
              return {
                ...o,
                AbrtgTxt: `${Number(o.Abrtg)}일`,
              };
            }
          })
        );

        this.toggleHasRowProperty();
      },

      initializeApplyInfoBox(detailData) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(detailData)) {
          const mSessionData = this.getAppointeeData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          oViewModel.setProperty('/ApplyInfo', { ...detailData });
        }
      },

      initializeApprovalBox(detailData) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/ApprovalDetails', { ...detailData });
      },

      initializeAttachBox() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/ZappStatAl');
        const sAppno = oViewModel.getProperty('/Appno') || '';
        const sType = oViewModel.getProperty('/type') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          Visible: !(sType === this.PAGE_TYPE.CANCEL),
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },

      callDialog(sType) {
        switch (sType) {
          case 'A':
            this.openFormDialog();
            break;
          case 'B':
            this.openFormChangeDialog();
            break;
          case 'C':
            this.openFormCancelDialog();
            break;
          default:
            break;
        }
      },

      async openFormDialog() {
        const oView = this.getView();

        AppUtils.setAppBusy(true);

        setTimeout(() => {
          if (!this.pFormDialog) {
            this.pFormDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.attendance.fragment.FormDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this.pFormDialog.then(function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      async openFormChangeDialog() {
        const oView = this.getView();

        if (!this.oFormChangeDialog) {
          this.oFormChangeDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.attendance.fragment.FormChangeDialog',
            controller: this,
          });

          this.oFormChangeDialog
            .attachBeforeOpen(() => {
              TableUtils.adjustRowSpan({
                oTable: this.byId('dialogChangeTable'),
                aColIndices: [8],
                sTheadOrTbody: 'thead',
              });

              this.getViewModel().setProperty('/form/dialog/search', {
                Begda: moment().startOf('year').hours(9).toDate(),
                Endda: moment().endOf('year').hours(9).toDate(),
              });
              this.retrieveChange();
            })
            .attachAfterOpen(() => this.byId('dialogChangeTable').clearSelection());

          oView.addDependent(this.oFormChangeDialog);
        }

        this.oFormChangeDialog.open();
      },

      async openHalfToOneDialog() {
        const oView = this.getView();

        if (!this.oHalfToOneDialog) {
          this.oHalfToOneDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.attendance.fragment.HalfToOneDialog',
            controller: this,
          });

          this.oHalfToOneDialog.attachBeforeOpen(() => {
            this.getViewModel().setProperty('/form/dialog/temp', {
              Begda: null,
              Tmrsn: '',
            });
          });

          oView.addDependent(this.oHalfToOneDialog);
        }

        this.oHalfToOneDialog.open();
      },

      async openOneToHalfDialog() {
        const oView = this.getView();

        if (!this.oOneToHalfDialog) {
          this.oOneToHalfDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.attendance.fragment.OneToHalfDialog',
            controller: this,
          });

          this.oOneToHalfDialog.attachBeforeOpen(() => {
            this.getViewModel().setProperty('/form/dialog/temp', {
              Awart1: '2001',
              Awart2: '2002',
              Begda1: null,
              Begda2: null,
              Tmrsn: '',
            });
          });

          oView.addDependent(this.oOneToHalfDialog);
        }

        this.oOneToHalfDialog.open();
      },

      async openFormCancelDialog() {
        const oView = this.getView();

        if (!this.oFormCancelDialog) {
          this.oFormCancelDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.attendance.fragment.FormCancelDialog',
            controller: this,
          });

          this.oFormCancelDialog
            .attachBeforeOpen(() => {
              this.getViewModel().setProperty('/form/dialog/search', {
                Begda: moment().startOf('year').hours(9).toDate(),
                Endda: moment().endOf('year').hours(9).toDate(),
              });
              this.retrieveCancel();
            })
            .attachAfterOpen(() => this.byId('dialogCancelTable').clearSelection());

          oView.addDependent(this.oFormCancelDialog);
        }

        this.oFormCancelDialog.open();
      },

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const aTableData = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/hasRow', !!aTableData.length);
      },

      async retrieveChange() {
        const oViewModel = this.getViewModel();
        const mSearchConditions = oViewModel.getProperty('/form/dialog/search');

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const aList = oViewModel.getProperty('/form/list');
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveChangeList', {
            Prcty: 'C',
            Pernr: this.getAppointeeProperty('Pernr'),
            Begda: DateUtils.parse(mSearchConditions.Begda),
            Endda: DateUtils.parse(mSearchConditions.Endda),
          });

          oViewModel.setProperty(
            '/form/dialog/list',
            _.chain(aResults)
              .filter((o) => !_.some(aList, (d) => _.isEqual(o.Awart2, d.Awart2) && moment(o.Begda2).isSame(moment(d.Begda2))))
              .map((o) => ({ ..._.omit(o, '__metadata'), isActive: false, isValid: false }))
              .value()
          );
        } catch (oError) {
          this.debug('Controller > Attendance Detail > retrieveChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      async retrieveCancel() {
        const oViewModel = this.getViewModel();
        const mSearchConditions = oViewModel.getProperty('/form/dialog/search');

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const aList = oViewModel.getProperty('/form/list');
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveChangeList', {
            Prcty: 'D',
            Pernr: this.getAppointeeProperty('Pernr'),
            Begda: moment(mSearchConditions.Begda).hours(9).toDate(),
            Endda: moment(mSearchConditions.Endda).hours(9).toDate(),
          });

          oViewModel.setProperty(
            '/form/dialog/list',
            _.chain(aResults)
              .filter((o) => !_.some(aList, (d) => _.isEqual(o.Awart2, d.Awart2) && moment(o.Begda2).isSame(moment(d.Begda2))))
              .map((o) => ({ ..._.omit(o, '__metadata'), isActive: false }))
              .value()
          );
        } catch (oError) {
          this.debug('Controller > Attendance Detail > retrieveCancel Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      async validChangeLeave(oEvent) {
        const oViewModel = this.getViewModel();
        const mRowObject = oEvent.getSource().getParent().getBindingContext().getObject();

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const [mResultData] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveApplEmpList', {
            Menid: this.getCurrentMenuId(),
            Prcty: 'C',
            Pernr: this.getAppointeeProperty('Pernr'),
            Awart: mRowObject.Awart,
            Begda: moment(mRowObject.Begda).hours(9).toDate(),
            Endda: moment(mRowObject.Endda).hours(9).toDate(),
          });

          if (mResultData.Abrtg !== mRowObject.Abrtg2) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_04005') }); // 변경전의 일수와 같지 않으므로 변경후의 시작일과 종료일을 다시 입력하여 주십시오.
          }

          _.chain(mRowObject).set('Abrtg', mResultData.Abrtg).set('isValid', true).commit();
        } catch (oError) {
          _.chain(mRowObject).set('Abrtg', '').set('isValid', false).commit();

          this.debug('Controller > Attendance Detail > validChangeLeave Error', oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.refresh();
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      async createProcess({ sPrcty = 'C' }) {
        const oViewModel = this.getViewModel();

        try {
          const iAttachLength = AttachFileAction.getFileCount.call(this);
          let sAppno = oViewModel.getProperty('/Appno');

          if (!sAppno) {
            sAppno = await Appno.get();
            oViewModel.setProperty('/Appno', sAppno);
          }

          if (iAttachLength > 0) {
            await AttachFileAction.uploadFile.call(this, sAppno, this.APPTP);
          }

          const aTableData = _.cloneDeep(oViewModel.getProperty('/form/list'));
          const mAppointeeData = this.getAppointeeData();
          const sAppty = oViewModel.getProperty('/type');

          await Client.deep(this.getModel(ServiceNames.WORKTIME), 'LeaveApplContent', {
            Menid: this.getCurrentMenuId(),
            Pernr: mAppointeeData.Pernr,
            Orgeh: mAppointeeData.Orgeh,
            Appno: sAppno,
            Prcty: sPrcty,
            Appty: sAppty, // A:신규, B:변경, C:취소
            LeaveApplNav1: aTableData.map((o) => ({ ...o, Pernr: mAppointeeData.Pernr })),
          });

          // {임시저장|신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.ACTION_MESSAGE[sPrcty]), {
            onClose: () => {
              this.getRouter().navTo(oViewModel.getProperty('/previousName'));
            },
          });
        } catch (oError) {
          this.debug('Controller > Attendance Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectionChangeTableRow(oEvent) {
        if (!oEvent.getParameter('rowContext')) return;

        const oViewModel = this.getViewModel();
        const sRowPath = oEvent.getParameter('rowContext').getPath();

        oViewModel.setProperty(`${sRowPath}/isActive`, oEvent.getSource().getSelectedIndex() !== -1);
      },

      onSelectionCancelTableRow(oEvent) {
        if (!oEvent.getParameter('rowContext')) return;

        const oViewModel = this.getViewModel();
        const sRowPath = oEvent.getParameter('rowContext').getPath();

        oViewModel.setProperty(`${sRowPath}/isActive`, oEvent.getSource().getSelectedIndex() !== -1);
      },

      onChangeRowBegda(oEvent) {
        const mRowObject = oEvent.getSource().getParent().getBindingContext().getObject();

        _.set(mRowObject, 'Endda', mRowObject.Begda);

        this.validChangeLeave(oEvent);
      },

      onPressAMToPM() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('dialogChangeTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aDialogList = oViewModel.getProperty('/form/dialog/list');
        const aSelectedData = _.chain(aDialogList)
          .filter((o, i) => _.includes(aSelectedIndices, i))
          .cloneDeep()
          .value();

        if (aSelectedData.length !== 1 || _.get(aSelectedData, [0, 'Awart2']) !== '2001') {
          MessageBox.alert(this.getBundleText('MSG_04011')); // 반차(오후)로 변경하고자 하는 반차(오전) 1건만 선택하여 주십시오.
          return;
        }

        const aAwarts = oViewModel.getProperty('/form/dialog/awartCodeList');
        const aList = oViewModel.getProperty('/form/list');

        _.chain(aSelectedData)
          .set([0, 'Awart'], '2002')
          .set([0, 'Atext'], _.chain(aAwarts).find({ Awart: '2002' }).get('Atext').value())
          .commit();

        oViewModel.setProperty('/form/rowCount', _.sum([aList.length, aSelectedData.length]));
        oViewModel.setProperty('/form/list', _.concat(aList, aSelectedData));

        this.toggleHasRowProperty();
        this.onPressFormChangeDialogClose();
      },

      onPressPMToAM() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('dialogChangeTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aDialogList = oViewModel.getProperty('/form/dialog/list');
        const aSelectedData = _.filter(aDialogList, (o, i) => _.includes(aSelectedIndices, i));

        if (aSelectedData.length !== 1 || _.get(aSelectedData, [0, 'Awart2']) !== '2002') {
          MessageBox.alert(this.getBundleText('MSG_04012')); // 반차(오전)로 변경하고자 하는 반차(오후) 1건만 선택하여 주십시오.
          return;
        }

        const aAwarts = oViewModel.getProperty('/form/dialog/awartCodeList');
        const aList = oViewModel.getProperty('/form/list');

        _.chain(aSelectedData)
          .set([0, 'Awart'], '2001')
          .set([0, 'Atext'], _.chain(aAwarts).find({ Awart: '2001' }).get('Atext').value())
          .commit();

        oViewModel.setProperty('/form/rowCount', _.sum([aList.length, aSelectedData.length]));
        oViewModel.setProperty('/form/list', _.concat(aList, aSelectedData));

        this.toggleHasRowProperty();
        this.onPressFormChangeDialogClose();
      },

      onPressHalfToOne() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('dialogChangeTable');
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length !== 2) {
          MessageBox.alert(this.getBundleText('MSG_04003')); // 연차로 변경하고자 하는 반차 2건만 선택하여 주십시오.
          return;
        }

        const aDialogList = oViewModel.getProperty('/form/dialog/list');
        const aSelectedData = _.filter(aDialogList, (o, i) => _.includes(aSelectedIndices, i));

        if (_.some(aSelectedData, (o) => !_.includes(['2001', '2002'], o.Awart2))) {
          MessageBox.alert(this.getBundleText('MSG_04003')); // 연차로 변경하고자 하는 반차 2건만 선택하여 주십시오.
          return;
        }

        this.openHalfToOneDialog();
      },

      onPressOneToHalf() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('dialogChangeTable');
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length !== 1) {
          MessageBox.alert(this.getBundleText('MSG_04004')); // 연차로 변경하고자 하는 반차 2건만 선택하여 주십시오.
          return;
        }

        const mSelectedData = oViewModel.getProperty(`/form/dialog/list/${aSelectedIndices[0]}`);

        if (mSelectedData.Awart2 !== '2000') {
          MessageBox.alert(this.getBundleText('MSG_04004')); // 연차로 변경하고자 하는 반차 2건만 선택하여 주십시오.
          return;
        }

        this.openOneToHalfDialog();
      },

      onPressAddBtn() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data', { Awart: 'ALL' });

        this.callDialog(sType);
      },

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const oTable = sType === 'B' ? this.byId('approveMultipleTable') : this.byId('approveSingleTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00021'), {
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            const aGroupIds = [];
            const aUnSelectedData = _.chain(aTableData)
              .filter((elem, idx) => {
                aGroupIds.push(elem.GroupId);

                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              })
              .filter((o) => !_.includes(_.compact(aGroupIds), o.GroupId))
              .value();

            oViewModel.setProperty('/form/list', aUnSelectedData);
            oViewModel.setProperty('/form/rowCount', aUnSelectedData.length);

            this.toggleHasRowProperty();
            oTable.clearSelection();
          },
        });
      },

      onChangeAwartCombo(oEvent) {
        const oViewModel = this.getViewModel();
        const sSelectedValue = oEvent.getSource().getSelectedItem().getText();

        oViewModel.setProperty('/form/dialog/data/Atext', sSelectedValue);
        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data/Begda', null);
        oViewModel.setProperty('/form/dialog/data/Endda', null);
        oViewModel.setProperty('/form/dialog/data/Abrst', null);
        oViewModel.setProperty('/form/dialog/data/Abrtg', null);
        oViewModel.setProperty('/form/dialog/data/AbrtgTxt', null);
      },

      async onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/form/dialog/data');

        try {
          const [mResultData] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveApplEmpList', {
            Menid: this.getCurrentMenuId(),
            Prcty: 'C',
            Pernr: this.getAppointeeProperty('Pernr'),
            Awart: mFormData.Awart,
            Begda: moment(mFormData.Begda).hours(9).toDate(),
            Endda: moment(mFormData.Endda).hours(9).toDate(),
          });

          if (!_.isEmpty(mResultData)) {
            oViewModel.setProperty('/form/dialog/data/Abrst', mResultData.Abrst);
            oViewModel.setProperty('/form/dialog/data/Abrtg', mResultData.Abrtg);
            oViewModel.setProperty('/form/dialog/data/AbrtgTxt', `${parseInt(mResultData.Abrtg, 10)}일`);
            oViewModel.setProperty('/form/dialog/calcCompleted', true);
          }
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onChangeLeaveDate Error', oError);

          AppUtils.handleError(oError);

          oViewModel.setProperty('/form/dialog/data/Abrst', null);
          oViewModel.setProperty('/form/dialog/data/Abrtg', null);
          oViewModel.setProperty('/form/dialog/data/AbrtgTxt', '');
          oViewModel.setProperty('/form/dialog/calcCompleted', false);
        }
      },

      onPressFormDialogClose() {
        AppUtils.setAppBusy(false);
        this.byId('formDialog').close();
      },

      onPressFormChangeDialogClose() {
        this.oFormChangeDialog.close();
      },

      onPressFormCancelDialogClose() {
        this.oFormCancelDialog.close();
      },

      onPressHalfToOneDialogClose() {
        this.oHalfToOneDialog.close();
      },

      onPressOneToHalfDialogClose() {
        this.oOneToHalfDialog.close();
      },

      async onPressHalfToOneDialogSave() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const sAnnualCode = '2000'; // 연차
          const mTempData = oViewModel.getProperty('/form/dialog/temp');
          const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveApplEmpList', {
            Menid: this.getCurrentMenuId(),
            Prcty: 'C',
            Awart: sAnnualCode,
            Begda: moment(mTempData.Begda).hours(9).toDate(),
            Endda: moment(mTempData.Begda).hours(9).toDate(),
          });

          if (_.toNumber(mResult.Abrtg) !== 1) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_04007') }); // 해당 일자에는 입력이 불가합니다. 다시 입력하여 주십시오.
          }

          const oTable = this.byId('dialogChangeTable');
          const sUniqId = _.uniqueId('half_');
          const aAwarts = oViewModel.getProperty('/form/dialog/awartCodeList');
          const aList = oViewModel.getProperty('/form/list');
          const aDialogList = oViewModel.getProperty('/form/dialog/list');
          const aSelectedIndex = oTable.getSelectedIndices();
          const aSelectedData = _.chain(aDialogList)
            .filter((o, i) => _.includes(aSelectedIndex, i))
            .map((o) => ({
              ..._.omit(o, ['isActive', 'isValid']),
              GroupId: sUniqId,
              Awart: sAnnualCode,
              Atext: _.chain(aAwarts).find({ Awart: sAnnualCode }).get('Atext').value(),
              Begda: mTempData.Begda,
              Endda: mTempData.Begda,
              Abrtg: mResult.Abrtg,
              Tmrsn: _.isEmpty(mTempData.Tmrsn) ? o.Tmrsn : mTempData.Tmrsn,
            }))
            .value();

          oViewModel.setProperty('/form/rowCount', _.sum([aList.length, aSelectedData.length]));
          oViewModel.setProperty('/form/list', _.concat(aList, aSelectedData));

          this.toggleHasRowProperty();
          this.onPressHalfToOneDialogClose();
          this.onPressFormChangeDialogClose();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onPressHalfToOneDialogSave Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      async onPressOneToHalfDialogSave() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const mTempData = oViewModel.getProperty('/form/dialog/temp');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const [[mHalf1], [mHalf2]] = await Promise.all([
            fCurried('LeaveApplEmpList', {
              Menid: this.getCurrentMenuId(),
              Prcty: 'C',
              Awart: mTempData.Awart1,
              Begda: moment(mTempData.Begda1).hours(9).toDate(),
              Endda: moment(mTempData.Begda1).hours(9).toDate(),
            }),
            fCurried('LeaveApplEmpList', {
              Menid: this.getCurrentMenuId(),
              Prcty: 'C',
              Awart: mTempData.Awart2,
              Begda: moment(mTempData.Begda2).hours(9).toDate(),
              Endda: moment(mTempData.Begda2).hours(9).toDate(),
            }),
          ]);

          if (_.toNumber(mHalf1.Abrtg) !== 0.5) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_04006', 'LABEL_04023') }); // {반차1}의 일자에는 입력이 불가합니다. 다시 입력하여 주십시오.
          }
          if (_.toNumber(mHalf2.Abrtg) !== 0.5) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_04006', 'LABEL_04007') }); // {반차2}의 일자에는 입력이 불가합니다. 다시 입력하여 주십시오.
          }

          const oTable = this.byId('dialogChangeTable');
          const sUniqId = _.uniqueId('half_');
          const aAwarts = oViewModel.getProperty('/form/dialog/awartCodeList');
          const aList = oViewModel.getProperty('/form/list');
          const aDialogList = oViewModel.getProperty('/form/dialog/list');
          const [iSelectedIndex] = oTable.getSelectedIndices();
          const mSelectedData = _.chain(aDialogList)
            .filter((o, i) => _.isEqual(iSelectedIndex, i))
            .head()
            .omit(['isActive', 'isValid'])
            .set('GroupId', sUniqId)
            .value();

          oViewModel.setProperty('/form/rowCount', _.sum([aList.length, 2]));
          oViewModel.setProperty(
            '/form/list',
            _.concat(
              aList, //
              { ...mSelectedData, Awart: mTempData.Awart1, Atext: _.chain(aAwarts).find({ Awart: mTempData.Awart1 }).get('Atext').value(), Begda: mTempData.Begda1, Endda: mTempData.Begda1, Abrtg: mHalf1.Abrtg, Tmrsn: _.isEmpty(mTempData.Tmrsn) ? mSelectedData.Tmrsn : mTempData.Tmrsn },
              { ...mSelectedData, Awart: mTempData.Awart2, Atext: _.chain(aAwarts).find({ Awart: mTempData.Awart2 }).get('Atext').value(), Begda: mTempData.Begda2, Endda: mTempData.Begda2, Abrtg: mHalf2.Abrtg, Tmrsn: _.isEmpty(mTempData.Tmrsn) ? mSelectedData.Tmrsn : mTempData.Tmrsn }
            )
          );

          this.toggleHasRowProperty();
          this.onPressOneToHalfDialogClose();
          this.onPressFormChangeDialogClose();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onPressOneToHalfDialogSave Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      onPressFormChangeDialogSave() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const oTable = this.byId('dialogChangeTable');
          const aSelectedIndices = oTable.getSelectedIndices();

          if (!aSelectedIndices.length) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00010', 'LABEL_04003') }); // {변경신청}할 데이터를 선택하세요.
          }

          const aDialogList = _.filter(oViewModel.getProperty('/form/dialog/list'), (o, i) => _.includes(aSelectedIndices, i));

          if (_.some(aDialogList, (o) => _.isEqual(o.isValid, false))) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_04001') }); // 계산이 수행되지 않아 저장이 불가합니다.
          }

          const aList = oViewModel.getProperty('/form/list');

          oViewModel.setProperty('/form/rowCount', _.sum([aList.length, aDialogList.length]));
          oViewModel.setProperty(
            '/form/list',
            _.concat(
              aList,
              _.map(aDialogList, (o) => _.omit(o, ['isActive', 'isValid']))
            )
          );

          this.toggleHasRowProperty();
          this.onPressFormChangeDialogClose();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onPressFormChangeDialogSave Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      onPressFormCancelDialogSave() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/busy', true);

        try {
          const oTable = this.byId('dialogCancelTable');
          const aSelectedIndices = oTable.getSelectedIndices();

          if (!aSelectedIndices.length) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_00010', 'LABEL_04004') }); // {취소신청}할 데이터를 선택하세요.
          }

          const aDialogList = _.filter(oViewModel.getProperty('/form/dialog/list'), (o, i) => _.includes(aSelectedIndices, i));
          const aList = oViewModel.getProperty('/form/list');

          oViewModel.setProperty('/form/rowCount', _.sum([aList.length, aDialogList.length]));
          oViewModel.setProperty(
            '/form/list',
            _.concat(
              aList,
              _.map(aDialogList, (o) =>
                _.chain(o)
                  .omit('isActive')
                  .set('AbrtgTxt', `${_.toNumber(o.Abrtg)}일`)
                  .value()
              )
            )
          );

          this.toggleHasRowProperty();
          this.onPressFormCancelDialogClose();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onPressFormCancelDialogSave Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/form/dialog/busy', false);
        }
      },

      onPressFormDialogSave() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const bCalcCompleted = oViewModel.getProperty('/form/dialog/calcCompleted');
        const mInputData = oViewModel.getProperty('/form/dialog/data');
        const mCheckFields = [
          { field: 'Tmrsn', label: this.getBundleText('LABEL_04009'), type: Validator.INPUT2 }, // 근태사유
        ];
        let oTable;

        if (!bCalcCompleted) {
          MessageBox.error(this.getBundleText('MSG_04001')); // 계산이 수행되지 않아 저장이 불가합니다.
          return;
        }

        if (!Validator.check({ mFieldValue: mInputData, aFieldProperties: mCheckFields })) return;

        if (sType === this.PAGE_TYPE.CHANGE) {
          const sRowPath = oViewModel.getProperty('/form/dialog/selectedRowPath');
          const mRowData = oViewModel.getProperty(sRowPath);
          const mChangedData = {
            ...mRowData,
            ...mInputData,
            isChanged: true,
            AbrtgTxt: Number(mInputData.Abrtg),
            Tmrsn: mInputData.Tmrsn,
            Begda: DateUtils.parse(mInputData.Begda),
            Endda: DateUtils.parse(mInputData.Endda),
          };
          oTable = this.byId('approveMultipleTable');

          if (DateUtils.format(mRowData.Begda2) === DateUtils.format(mChangedData.Begda) && DateUtils.format(mRowData.Endda2) === DateUtils.format(mChangedData.Endda)) {
            MessageBox.error(this.getBundleText('MSG_04002')); // 변경된 데이터가 없습니다.
            return;
          }

          oViewModel.setProperty(sRowPath, mChangedData);
        } else {
          const aListData = oViewModel.getProperty('/form/list');
          oTable = this.byId('approveSingleTable');

          aListData.push({
            ...mInputData,
            Begda: DateUtils.parse(mInputData.Begda),
            Endda: DateUtils.parse(mInputData.Endda),
          });

          oViewModel.setProperty('/form/list', aListData);
          oViewModel.setProperty('/form/rowCount', aListData.length);
        }

        oTable.clearSelection();
        this.toggleHasRowProperty();

        AppUtils.setAppBusy(false);
        this.byId('formDialog').close();
      },

      onPressApproval() {
        AppUtils.setAppBusy(true);

        const sPrcty = 'C';

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false);
              return;
            }

            this.createProcess({ sPrcty });
          },
        });
      },

      /*****************************************************************
       * ! Call OData
       *****************************************************************/
    });
  }
);
