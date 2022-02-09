/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.WorkTimeDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormData: {},
          FieldLimit: {},
          employees: [],
          CauseType: [],
          detail: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          dialog: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtWorkApply')));

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const aEmployees = await Client.getEntitySet(oCommonModel, 'EmpSearchResult', {
            Menid: this.getCurrentMenuId(),
            Persa: this.getAppointeeProperty('Werks'),
            Stat2: '3',
            Zflag: 'X',
            Actda: moment().hour(9).toDate(),
          });

          oDetailModel.setProperty(
            '/employees',
            aEmployees.map((o) => ({ ...o, Pernr: _.trimStart(o.Pernr, '0') }))
          );

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            const oTargetData = await Client.getEntitySet(oModel, 'OtWorkApply', {
              Appno: sDataKey,
            });

            const iLength = oTargetData.length;

            oDetailModel.setProperty('/detail', {
              listMode: 'MultiToggle',
              list: oTargetData,
              rowCount: iLength < 5 ? iLength : 5,
            });

            oDetailModel.setProperty('/ApplyInfo', oTargetData[0]);
            oDetailModel.setProperty('/ApprovalDetails', oTargetData[0]);
          }

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      // 근무시간
      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR17';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 신청내역 추가
      onAddDetail() {
        const oView = this.getView();
        AppUtils.setAppBusy(true, this);

        setTimeout(() => {
          if (!this._pDetailDialog) {
            this._pDetailDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.workTime.fragment.WorkTimeDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          const oDetailModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mAppointeeData = this.getAppointeeData();

          this._pDetailDialog.then(async function (oDialog) {
            // 근무 사유
            const aCauseList = await Client.getEntitySet(oModel, 'WorktimeCodeList', {
              Datum: new Date(),
              Cdnum: 'TM0003',
              Grcod: 'TM000003',
            });

            oDetailModel.setProperty('/CauseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCauseList }));
            oDetailModel.setProperty('/DialogData', {
              Datum: new Date(),
              Beguz: '18:00',
              Abrst: '',
              Ottyp: 'ALL',
            });

            oDetailModel.setProperty('/dialog/list', [...oDetailModel.getProperty('/detail/list')]);
            let iLength = 1;

            // 신청내역이 없을경우
            if (!_.size(oDetailModel.getProperty('/dialog/list'))) {
              oDetailModel.setProperty('/dialog/list', [
                {
                  Pernr: mAppointeeData.Pernr,
                  Ename: mAppointeeData.Ename,
                  Zzjikgbt: mAppointeeData.Zzjikgbt,
                  Zzjikcht: mAppointeeData.Zzjikcht,
                  Orgtx: mAppointeeData.Orgtx,
                },
              ]);

              iLength = _.size(oDetailModel.getProperty('/dialog/list'));
            } else {
            }

            oDetailModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
            AppUtils.setAppBusy(false, this);
            oDialog.open();
          });
        }, 100);
      },

      // 신청내역 삭제
      onDelDetail() {},

      // InputField사원검색
      onSelectSuggest(oEvent) {
        const oInput = oEvent.getSource();
        const oSelectedSuggestionRow = oEvent.getParameter('selectedRow');
        if (oSelectedSuggestionRow) {
          const oContext = oSelectedSuggestionRow.getBindingContext();
          oInput.setValue(oContext.getProperty('Pernr'));

          const sRowPath = oInput.getParent().getBindingContext().getPath();
          const oViewModel = this.getViewModel();
          oViewModel.setProperty(`${sRowPath}/Ename`, oContext.getProperty('Ename'));
          oViewModel.setProperty(`${sRowPath}/Orgtx`, oContext.getProperty('Fulln'));
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, oContext.getProperty('Zzjikgbt'));
        }
        oInput.getBinding('suggestionRows').filter([]);
      },

      // 사원검색 Submit
      onSubmitSuggest(oEvent) {
        const oViewModel = this.getViewModel();
        const oInput = oEvent.getSource();
        const oContext = oInput.getParent().getBindingContext();
        const sRowPath = oContext.getPath();

        const sInputValue = oEvent.getParameter('value');
        if (!sInputValue) {
          oViewModel.setProperty(`${sRowPath}/Pernr`, '');
          oViewModel.setProperty(`${sRowPath}/Ename`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikcht`, '');
          oViewModel.setProperty(`${sRowPath}/Orgtx`, '');
          return;
        }

        const aEmployees = oViewModel.getProperty('/employees');
        const [mEmployee] = _.filter(aEmployees, (o) => _.startsWith(o.Pernr, sInputValue));

        if (sRowPath && !_.isEmpty(mEmployee)) {
          oViewModel.setProperty(`${sRowPath}/Pernr`, mEmployee.Pernr);
          oViewModel.setProperty(`${sRowPath}/Ename`, mEmployee.Ename);
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, mEmployee.Zzjikgbt);
          oViewModel.setProperty(`${sRowPath}/Zzjikcht`, mEmployee.Zzjikcht);
          oViewModel.setProperty(`${sRowPath}/Orgtx`, mEmployee.Fulln);
        } else {
          oViewModel.setProperty(`${sRowPath}/Pernr`, '');
          oViewModel.setProperty(`${sRowPath}/Ename`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikcht`, '');
          oViewModel.setProperty(`${sRowPath}/Orgtx`, '');
        }
      },

      // Dialog 사유선택
      onCause(oEvent) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty(
          '/DialogData/Ottyptx',
          _.chain(oDetailModel.getProperty('/CauseType'))
            .find((e) => {
              return e.Zcode === oEvent.getSource().getSelectedKey();
            })
            .get('Ztext')
            .value()
        );
      },

      // Dialog 저장
      onDialogSavBtn() {
        if (this.checkError()) {
          return;
        }

        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');
        const aFilterList = _.chain(oDetailModel.getProperty('/dialog/list'))
          .filter((e) => {
            return !!e.Pernr;
          })
          .each((e) => {
            e.Datum = mDialogData.Datum;
            e.Beguz = mDialogData.Beguz;
            e.Enduz = mDialogData.Enduz;
            e.Abrst = mDialogData.Abrst;
            e.Ottyptx = mDialogData.Ottyp;
            e.Atrsn = mDialogData.Atrsn;
          })
          .value();

        oDetailModel.setProperty('/detail/list', aFilterList);
      },

      //  Dialig 추가
      onDialogAdd() {
        const oDetailModel = this.getViewModel();
        const aDialogTable = oDetailModel.getProperty('/dialog/list');

        oDetailModel.setProperty('/dialog/list', [
          ...aDialogTable,
          {
            Pernr: '',
            Ename: '',
            Zzjikgbt: '',
            Zzjikcht: '',
            Orgtx: '',
          },
        ]);

        const iLength = _.size(oDetailModel.getProperty('/dialog/list'));

        oDetailModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
      },

      // Dialog 삭제
      onDialogDel() {},

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // 근무시간
      onTimePicker() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');
        let iWorkTime = _.subtract(mDialogData.Enduz.replace(':', ''), mDialogData.Beguz.replace(':', ''));

        iWorkTime = Math.sign(iWorkTime) === -1 ? iWorkTime + 2400 : iWorkTime;
        oDetailModel.setProperty('/DialogData/Abrst', !iWorkTime ? '' : _.toString(iWorkTime));
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');

        // 사유
        if (mDialogData.Ottyp === 'ALL' || !mDialogData.Ottyp) {
          MessageBox.alert(this.getBundleText('MSG_27004'));
          return true;
        }

        // 근무시간
        if (mDialogData.Abrst === '0' || !mDialogData.Abrst) {
          MessageBox.alert(this.getBundleText('MSG_27005'));
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
        if (this.checkError('C')) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oDetailModel = this.getViewModel();
              const sAppno = oDetailModel.getProperty('/FormData/Appno');

              if (!sAppno) {
                const sAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }

              const mFormData = oDetailModel.getProperty('/FormData');

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const oModel = this.getModel(ServiceNames.WORKTIME);
              let oSendObject = {
                ...mFormData,
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'OtWorkApply', oSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true, this);

            try {
              const oDetailModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.WORKTIME);

              await Client.remove(oModel, 'OtWorkApply', { Appno: oDetailModel.getProperty('/FormData/Appno') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
