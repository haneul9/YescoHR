/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.WorkTimeDetail', {
      initializeModel() {
        return {
          previousName: '',
          Fixed: true,
          DelBtn: false,
          FieldLimit: {},
          employees: [],
          DeletedRows: [],
          CauseType: [],
          WorkTimeList: [
            { Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') },
            { Zcode: 'Y', Ztext: 'Y' },
            { Zcode: 'N', Ztext: 'N' },
          ],
          WorkTimeList2: [
            { Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') },
            { Zcode: 'Y', Ztext: this.getBundleText('LABEL_27019') },
            { Zcode: 'N', Ztext: this.getBundleText('LABEL_27020') },
          ],
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
        };
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        oViewModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtWorkApply')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());
          oViewModel.setProperty('/busy', true);

          const sMenid = this.getCurrentMenuId();
          const sPernr = this.getAppointeeProperty('Pernr');
          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'OtpernrList', {
            Menid: sMenid,
            Datum: new Date(),
            Pernr: sPernr,
          });

          oViewModel.setProperty(
            '/employees',
            aOtpList.map((o) => ({ ...o, Pernr: _.trimStart(o.Pernr, '0') }))
          );

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oViewModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            oViewModel.setProperty('/busy', true);

            const oTargetData = await Client.getEntitySet(oModel, 'OtWorkApply', {
              Appno: sDataKey,
            });

            const iLength = oTargetData.length;

            oViewModel.setProperty('/detail', {
              listMode: 'None',
              list: oTargetData,
              rowCount: iLength < 5 ? iLength : 5,
            });

            oViewModel.setProperty('/Fixed', false);
            oViewModel.setProperty('/DelBtn', oTargetData[0].ZappStatAl === '20');
            oViewModel.setProperty('/ApplyInfo', oTargetData[0]);
            oViewModel.setProperty('/ApprovalDetails', oTargetData[0]);
          }

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
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

      // 신청내역 checkBox
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const aSelectedIndex = oEvent.getSource().getSelectedIndices();
        const oContext = oEvent.getParameter('rowContext');
        let aDelList = [];

        if (oContext) {
          const sTableId = oContext.getPath().split('/')[1];

          if (!_.isEmpty(aSelectedIndex)) {
            aDelList = _.map(aSelectedIndex, (e) => {
              return oViewModel.getProperty(`/${sTableId}/list/${e}`);
            });
          }
        }

        oViewModel.setProperty('/DeletedRows', aDelList);
      },

      // 신청내역 추가
      onAddDetail() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

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

            const oModel = this.getModel(ServiceNames.WORKTIME);
            const oEmpData = this.getAppointeeData();

            this.byId('workTimeTable').clearSelection();

            this._pDetailDialog.then(async function (oDialog) {
              // 근무 사유
              const aCauseList = await Client.getEntitySet(oModel, 'WorktimeCodeList', {
                Datum: new Date(),
                Cdnum: 'TM0003',
                Grcod: 'TM000003',
              });

              oViewModel.setProperty('/CauseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCauseList }));

              let aList = [];
              let iLength = 1;

              // 신청내역 없을때
              oViewModel.setProperty('/DialogData', {
                Datum: new Date(),
                Beguz: '18:00',
                Abrst: '',
                Ottyp: 'ALL',
                Dtype: 'ALL',
                Nxtwk: 'ALL',
                bType: false,
                bWork: false,
              });

              aList.push({
                Pernr: oEmpData.Pernr,
                Ename: oEmpData.Ename,
                Zzjikgbt: oEmpData.Zzjikgbt,
                Zzjikcht: oEmpData.Zzjikcht,
                Orgtx: oEmpData.Orgtx,
              });

              iLength = 1;

              oViewModel.setProperty('/dialog/list', aList);
              oViewModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
              oDialog.open();
            });
          }, 100);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 신청내역 삭제
      async onDelDetail() {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(oViewModel.getProperty('/DeletedRows'))) {
          // 삭제할 데이터를 선택하세요.
          return MessageBox.alert(this.getBundleText('MSG_00055'));
        }

        const aDiffList = _.difference(oViewModel.getProperty('/detail/list'), oViewModel.getProperty('/DeletedRows'));
        const iLength = _.size(aDiffList);

        oViewModel.setProperty('/detail/list', aDiffList);
        oViewModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);

        const mSendObject = {
          ...oViewModel.getProperty('/DialogData'),
          Appda: new Date(),
          Menid: this.getCurrentMenuId(),
          Prcty: 'V',
          OtWorkNav: aDiffList,
        };

        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oCheck = await Client.deep(oModel, 'OtWorkApply', mSendObject);

        oViewModel.setProperty(
          '/detail/list',
          _.map(oCheck.OtWorkNav.results, (o) => _.omit(o, ['__metadata', 'OtWorkNav']))
        );

        if (!!oCheck.Retmsg) {
          oCheck.Retmsg = _.replace(oCheck.Retmsg, '\\n', '\n');

          MessageBox.alert(oCheck.Retmsg);
        }
        this.byId('workTimeTable').clearSelection();
      },

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
          oViewModel.setProperty(`${sRowPath}/Orgtx`, oContext.getProperty('Orgtx'));
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, oContext.getProperty('Zzjikgbt'));
          oViewModel.setProperty(`${sRowPath}/Zzjikcht`, oContext.getProperty('Zzjikcht'));
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
          oViewModel.setProperty(`${sRowPath}/Orgtx`, mEmployee.Orgtx);
        } else {
          oViewModel.setProperty(`${sRowPath}/Pernr`, '');
          oViewModel.setProperty(`${sRowPath}/Ename`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikgbt`, '');
          oViewModel.setProperty(`${sRowPath}/Zzjikcht`, '');
          oViewModel.setProperty(`${sRowPath}/Orgtx`, '');
        }
      },

      // DialogAfterClose
      onDialogAfClose() {
        this.byId('dialogTable').clearSelection();
        this.getViewModel().setProperty('/DeletedRows', []);
      },

      // Dialog 저장
      async onDialogSavBtn() {
        if (this.checkError()) {
          return;
        }

        const oViewModel = this.getViewModel();
        try {
          oViewModel.setProperty('/busy', true);

          _.set(oViewModel.getProperty('/DialogData'), 'Beguz', oViewModel.getProperty('/DialogData/Beguz').replace(':', ''));
          _.set(oViewModel.getProperty('/DialogData'), 'Enduz', oViewModel.getProperty('/DialogData/Enduz').replace(':', ''));

          let mSendObject = {
            ...oViewModel.getProperty('/DialogData'),
            Appda: new Date(),
            Menid: this.getCurrentMenuId(),
            Prcty: 'V',
            OtWorkNav: [
              // prettier방지
              ...oViewModel.getProperty('/dialog/list'),
              ...oViewModel.getProperty('/detail/list'),
            ],
          };

          this.dateMovement();

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oCheck = await Client.deep(oModel, 'OtWorkApply', mSendObject);

          oViewModel.setProperty(
            '/detail/list',
            _.map(oCheck.OtWorkNav.results, (o) => _.omit(o, ['__metadata', 'OtWorkNav']))
          );

          if (!!oCheck.Retmsg) {
            oCheck.Retmsg = _.replace(oCheck.Retmsg, '\\n', '\n');

            MessageBox.alert(oCheck.Retmsg);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      dateMovement() {
        const oViewModel = this.getViewModel();
        const aDialogList = oViewModel.getProperty('/dialog/list');

        if (_.isEmpty(aDialogList)) {
          return;
        }

        const mDialogData = {
          ...oViewModel.getProperty('/DialogData'),
          Ottyptx: _.chain(oViewModel.getProperty('/CauseType'))
            .find((e) => {
              return e.Zcode === oViewModel.getProperty('/DialogData/Ottyp');
            })
            .get('Ztext')
            .value(),
        };

        const aFilterList = [
          ...oViewModel.getProperty('/detail/list'),
          ..._.chain(aDialogList)
            .filter((e) => {
              return !!e.Pernr;
            })
            .each((e) => {
              e.Datum = mDialogData.Datum;
              e.Beguz = mDialogData.Beguz.replace(':', '');
              e.Enduz = mDialogData.Enduz.replace(':', '');
              e.Abrst = mDialogData.Abrst;
              e.Ottyp = mDialogData.Ottyp;
              e.Ottyptx = mDialogData.Ottyptx;
              e.Dtype = mDialogData.Dtype === 'ALL' ? '' : mDialogData.Dtype;
              e.Nxtwktx = mDialogData.Nxtwk === 'ALL' ? '' : mDialogData.Nxtwk === 'Y' ? this.getBundleText('LABEL_27019') : this.getBundleText('LABEL_27020');
              e.Nxtwk = mDialogData.Nxtwk;
              e.Gaptm = mDialogData.Gaptm;
              e.Nxtoff = mDialogData.Nxtoff;
              e.Atrsn = mDialogData.Atrsn;
            })
            .value(),
        ];

        const iLength = _.size(aFilterList);

        oViewModel.setProperty('/detail/list', aFilterList);
        oViewModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
        this.byId('detailDialog').close();
      },

      //  Dialig 추가
      onDialogAdd() {
        const oViewModel = this.getViewModel();
        const aDialogTable = oViewModel.getProperty('/dialog/list');

        oViewModel.setProperty('/dialog/list', [
          ...aDialogTable,
          {
            Pernr: '',
            Ename: '',
            Zzjikgbt: '',
            Zzjikcht: '',
            Orgtx: '',
          },
        ]);

        const iLength = _.size(oViewModel.getProperty('/dialog/list'));

        oViewModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
      },

      // Dialog 삭제
      onDialogDel() {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(oViewModel.getProperty('/DeletedRows'))) {
          // 삭제할 데이터를 선택하세요.
          return MessageBox.alert(this.getBundleText('MSG_00055'));
        }

        const aDiffList = _.difference(oViewModel.getProperty('/dialog/list'), oViewModel.getProperty('/DeletedRows'));
        const iLength = _.size(aDiffList);

        oViewModel.setProperty('/dialog/list', aDiffList);
        oViewModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
        this.byId('dialogTable').clearSelection();
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // D유형 선택시
      async onDType(oEvent) {
        const oViewModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        try {
          oViewModel.setProperty('/busy', true);
          // 초과시간
          const oOverTime = await this.overTime({ Pernr: this.getAppointeeProperty('Pernr') }, sKey);

          oViewModel.setProperty('/DialogData/bType', !!oOverTime.Dtype);
          oViewModel.setProperty('/DialogData/bWork', !!oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Dtype', sKey);
          oViewModel.setProperty('/DialogData/Nxtwk', !oOverTime.Nxtwk ? 'ALL' : oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
          oViewModel.setProperty('/DialogData/Notes', oOverTime.Notes);
          oViewModel.setProperty('/DialogData/Gaptm', oOverTime.Gaptm);
          oViewModel.setProperty('/DialogData/Nxtoff', oOverTime.Nxtoff);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 근무시간
      async onTimePicker() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        if (!mDialogData.Enduz || !mDialogData.Beguz) {
          return;
        }

        try {
          oViewModel.setProperty('/busy', true);
          // 초과시간
          const oOverTime = await this.overTime();

          oViewModel.setProperty('/DialogData/bType', !!oOverTime.Dtype);
          oViewModel.setProperty('/DialogData/bWork', !!oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Dtype', !oOverTime.Dtype ? 'ALL' : oOverTime.Dtype);
          oViewModel.setProperty('/DialogData/Nxtwk', !oOverTime.Nxtwk ? 'ALL' : oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
          oViewModel.setProperty('/DialogData/Notes', oOverTime.Notes);
          oViewModel.setProperty('/DialogData/Gaptm', oOverTime.Gaptm);
          oViewModel.setProperty('/DialogData/Nxtoff', oOverTime.Nxtoff);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 근무일
      async onWorkDatePicker() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        if (!mDialogData.Datum || !mDialogData.Beguz || !mDialogData.Enduz) {
          return;
        }

        try {
          oViewModel.setProperty('/busy', true);
          // 초과시간
          const oOverTime = await this.overTime();

          oViewModel.setProperty('/DialogData/bType', !!oOverTime.Dtype);
          oViewModel.setProperty('/DialogData/bWork', !!oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Dtype', !oOverTime.Dtype ? 'ALL' : oOverTime.Dtype);
          oViewModel.setProperty('/DialogData/Nxtwk', !oOverTime.Nxtwk ? 'ALL' : oOverTime.Nxtwk);
          oViewModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
          oViewModel.setProperty('/DialogData/Notes', oOverTime.Notes);
          oViewModel.setProperty('/DialogData/Gaptm', oOverTime.Gaptm);
          oViewModel.setProperty('/DialogData/Nxtoff', oOverTime.Nxtoff);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 초과근무시간
      overTime(mData, sDtype = '') {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        if (!mDialogData.Beguz || !mDialogData.Enduz) {
          return;
        }

        let sPernr = this.getAppointeeProperty('Pernr');

        if (mData) {
          sPernr = mData.Pernr;
        }

        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Pernr: sPernr,
          Datum: mDialogData.Datum,
          Beguz: mDialogData.Beguz.replace(':', ''),
          Enduz: mDialogData.Enduz.replace(':', ''),
        };

        if (!!sDtype && sDtype !== 'ALL') {
          _.set(mPayLoad, 'Dtype', sDtype);
        }

        return Client.create(oModel, 'OtWorkApply', mPayLoad);
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

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

        // 시차출퇴근(D유형)
        if ((mDialogData.Dtype === 'ALL' || !mDialogData.Dtype) && mDialogData.bType) {
          MessageBox.alert(this.getBundleText('MSG_27010'));
          return true;
        }

        // 익일근무
        if ((mDialogData.Nxtwk === 'ALL' || !mDialogData.Nxtwk) && mDialogData.bWork) {
          MessageBox.alert(this.getBundleText('MSG_27011'));
          return true;
        }

        const aList = oViewModel.getProperty('/dialog/list');
        const aDetailList = oViewModel.getProperty('/detail/list');
        const aFilter = _.filter(aList, (e) => {
          return !!e.Pernr;
        });
        // 동일사번/일자
        if (
          !!_.chain(aDetailList)
            .filter((e) => {
              return _.find(aList, (e1) => {
                return e.Pernr === _.trimStart(e1.Pernr, '0');
              });
            })
            .find((e) => {
              return moment(e.Datum).format('YYYY.MM.DD') === moment(mDialogData.Datum).format('YYYY.MM.DD') && e.Beguz === mDialogData.Beguz.replace(':', '') && e.Enduz === mDialogData.Enduz.replace(':', '');
            })
            .value() ||
          _.chain(aFilter)
            .map((e) => {
              return (e.Pernr = _.trimStart(e.Pernr, '0'));
            })
            .uniq()
            .size()
            .value() !== _.size(aFilter)
        ) {
          MessageBox.alert(this.getBundleText('MSG_27006'));
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
        if (_.isEmpty(this.getViewModel().getProperty('/detail/list'))) {
          // 신청내역을 등록하세요.
          return MessageBox.alert(this.getBundleText('MSG_27007'));
        }

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
              AppUtils.setAppBusy(true);

              const oViewModel = this.getViewModel();
              const sAppno = await Appno.get.call(this);
              const oModel = this.getModel(ServiceNames.WORKTIME);
              const aDetailList = _.each(oViewModel.getProperty('/detail/list'), (e) => {
                e.Beguz = e.Beguz.replace(':', '');
                e.Enduz = e.Enduz.replace(':', '');
              });
              const mSendObject = {
                ...aDetailList[0],
                Appno: sAppno,
                Appda: new Date(),
                Menid: this.getCurrentMenuId(),
                Prcty: 'C',
                OtWorkNav: aDetailList,
              };

              // FileUpload
              if (!!this.AttachFileAction.getFileCount.call(this)) {
                await this.AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
              }

              const oUrl = await Client.deep(oModel, 'OtWorkApply', mSendObject);

              if (oUrl.ZappUrl) {
                window.open(oUrl.ZappUrl, '_blank');
              }

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const [aDetailList] = oViewModel.getProperty('/detail/list');
        const sAppno = _.isEmpty(aDetailList) ? '' : aDetailList.Appno;

        this.AttachFileAction.setAttachFile(this, {
          Editable: oViewModel.getProperty('/Fixed'),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
