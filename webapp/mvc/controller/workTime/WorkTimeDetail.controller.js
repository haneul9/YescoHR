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
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        oDetailModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtWorkApply')));
          oDetailModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());
          oDetailModel.setProperty('/busy', true);

          const sMenid = this.getCurrentMenuId();
          const sPernr = this.getAppointeeProperty('Pernr');
          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'OtpernrList', {
            Menid: sMenid,
            Datum: new Date(),
            Pernr: sPernr,
          });

          oDetailModel.setProperty(
            '/employees',
            aOtpList.map((o) => ({ ...o, Pernr: _.trimStart(o.Pernr, '0') }))
          );

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            oDetailModel.setProperty('/busy', true);

            const oTargetData = await Client.getEntitySet(oModel, 'OtWorkApply', {
              Appno: sDataKey,
            });

            const iLength = oTargetData.length;

            oDetailModel.setProperty('/detail', {
              listMode: 'None',
              list: oTargetData,
              rowCount: iLength < 5 ? iLength : 5,
            });

            oDetailModel.setProperty('/Fixed', false);
            oDetailModel.setProperty('/DelBtn', oTargetData[0].ZappStatAl === '20');
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

      // 신청내역 checkBox
      onRowSelection(oEvent) {
        const oDetailModel = this.getViewModel();
        const aSelectedIndex = oEvent.getSource().getSelectedIndices();
        const oContext = oEvent.getParameter('rowContext');
        let aDelList = [];

        if (oContext) {
          const sTableId = oContext.getPath().split('/')[1];

          if (!_.isEmpty(aSelectedIndex)) {
            aDelList = _.map(aSelectedIndex, (e) => {
              return oDetailModel.getProperty(`/${sTableId}/list/${e}`);
            });
          }
        }

        oDetailModel.setProperty('/DeletedRows', aDelList);
      },

      // 신청내역 추가
      onAddDetail() {
        const oView = this.getView();

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
          const oEmpData = this.getAppointeeData();

          this.byId('workTimeTable').clearSelection();

          this._pDetailDialog.then(async function (oDialog) {
            // 근무 사유
            const aCauseList = await Client.getEntitySet(oModel, 'WorktimeCodeList', {
              Datum: new Date(),
              Cdnum: 'TM0003',
              Grcod: 'TM000003',
            });

            oDetailModel.setProperty('/CauseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCauseList }));

            let aList = [];
            let iLength = 1;

            // 신청내역 없을때
            oDetailModel.setProperty('/DialogData', {
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

            oDetailModel.setProperty('/dialog/list', aList);
            oDetailModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
            oDialog.open();
          });
        }, 100);
      },

      // 신청내역 삭제
      onDelDetail() {
        const oDetailModel = this.getViewModel();

        if (_.isEmpty(oDetailModel.getProperty('/DeletedRows'))) {
          // 삭제할 데이터를 선택하세요.
          return MessageBox.alert(this.getBundleText('MSG_00055'));
        }

        const aDiffList = _.difference(oDetailModel.getProperty('/detail/list'), oDetailModel.getProperty('/DeletedRows'));
        const iLength = _.size(aDiffList);

        oDetailModel.setProperty('/detail/list', aDiffList);
        oDetailModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
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

        const oDetailModel = this.getViewModel();

        await Promise.all(
          _.forEach(oDetailModel.getProperty('/dialog/list'), async (e, i) => {
            const oOverTime = await this.overTime(e);

            oDetailModel.setProperty(`/dialog/list/${i}/Notes`, oOverTime.Notes);
            this.dateMovement(i + 1);
          })
        );
      },

      dateMovement(index) {
        const oDetailModel = this.getViewModel();
        const aDialogList = oDetailModel.getProperty('/dialog/list');

        if (index !== _.size(aDialogList)) {
          return;
        }

        const mDialogData = {
          ...oDetailModel.getProperty('/DialogData'),
          Ottyptx: _.chain(oDetailModel.getProperty('/CauseType'))
            .find((e) => {
              return e.Zcode === oDetailModel.getProperty('/DialogData/Ottyp');
            })
            .get('Ztext')
            .value(),
        };

        const aFilterList = [
          ...oDetailModel.getProperty('/detail/list'),
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

        oDetailModel.setProperty('/detail/list', aFilterList);
        oDetailModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
        this.byId('detailDialog').close();
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
      onDialogDel() {
        const oDetailModel = this.getViewModel();

        if (_.isEmpty(oDetailModel.getProperty('/DeletedRows'))) {
          // 삭제할 데이터를 선택하세요.
          return MessageBox.alert(this.getBundleText('MSG_00055'));
        }

        const aDiffList = _.difference(oDetailModel.getProperty('/dialog/list'), oDetailModel.getProperty('/DeletedRows'));
        const iLength = _.size(aDiffList);

        oDetailModel.setProperty('/dialog/list', aDiffList);
        oDetailModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
        this.byId('dialogTable').clearSelection();
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // Dialog 근무시간
      async onTimePicker() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');

        if (!mDialogData.Enduz || !mDialogData.Beguz) {
          return;
        }

        // 초과시간
        const oOverTime = await this.overTime();

        oDetailModel.setProperty('/DialogData/bType', !!oOverTime.Dtype);
        oDetailModel.setProperty('/DialogData/bWork', !!oOverTime.Nxtwk);
        oDetailModel.setProperty('/DialogData/Dtype', !oOverTime.Dtype ? 'ALL' : oOverTime.Dtype);
        oDetailModel.setProperty('/DialogData/Nxtwk', !oOverTime.Nxtwk ? 'ALL' : oOverTime.Nxtwk);
        oDetailModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
        oDetailModel.setProperty('/DialogData/Notes', oOverTime.Notes);
        oDetailModel.setProperty('/DialogData/Gaptm', oOverTime.Gaptm);
        oDetailModel.setProperty('/DialogData/Nxtoff', oOverTime.Nxtoff);
      },

      // Dialog 근무일
      async onWorkDatePicker() {
        const oDetailModel = this.getViewModel();

        if (!oDetailModel.getProperty('/DialogData/Datum')) {
          return;
        }

        // 초과시간
        const oOverTime = await this.overTime();

        oDetailModel.setProperty('/DialogData/bType', !!oOverTime.Dtype);
        oDetailModel.setProperty('/DialogData/bWork', !!oOverTime.Nxtwk);
        oDetailModel.setProperty('/DialogData/Dtype', !oOverTime.Dtype ? 'ALL' : oOverTime.Dtype);
        oDetailModel.setProperty('/DialogData/Nxtwk', !oOverTime.Nxtwk ? 'ALL' : oOverTime.Nxtwk);
        oDetailModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
        oDetailModel.setProperty('/DialogData/Notes', oOverTime.Notes);
        oDetailModel.setProperty('/DialogData/Gaptm', oOverTime.Gaptm);
        oDetailModel.setProperty('/DialogData/Nxtoff', oOverTime.Nxtoff);
      },

      // Dialog 초과근무시간
      overTime(mData) {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/DialogData');

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

        return Client.create(oModel, 'OtWorkApply', mPayLoad);
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

        const aList = oDetailModel.getProperty('/dialog/list');
        const aDetailList = oDetailModel.getProperty('/detail/list');
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

              const oDetailModel = this.getViewModel();
              const sAppno = await Appno.get.call(this);
              const oModel = this.getModel(ServiceNames.WORKTIME);
              const aDetailList = _.each(oDetailModel.getProperty('/detail/list'), (e) => {
                e.Beguz = e.Beguz.replace(':', '');
                e.Enduz = e.Enduz.replace(':', '');
              });
              let oSendObject = {
                ...aDetailList[0],
                Appno: sAppno,
                Appda: new Date(),
                Menid: this.getCurrentMenuId(),
                Prcty: 'V',
                OtWorkNav: aDetailList,
              };

              const oCheck = await Client.deep(oModel, 'OtWorkApply', oSendObject);

              if (!!oCheck.Retmsg) {
                AppUtils.setAppBusy(false);
                oCheck.Retmsg = _.replace(oCheck.Retmsg, '\\n', '\n');

                // {신청}하시겠습니까?
                MessageBox.confirm(oCheck.Retmsg, {
                  // 신청, 취소
                  actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
                  onClose: async (vPress) => {
                    // 신청
                    if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
                      return;
                    }

                    try {
                      AppUtils.setAppBusy(true);

                      // FileUpload
                      if (!!this.AttachFileAction.getFileCount.call(this)) {
                        await this.AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                      }

                      oSendObject.Prcty = 'C';

                      const oUrl = await Client.deep(oModel, 'OtWorkApply', oSendObject);

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
                    }
                  },
                });
              } else {
                // FileUpload
                if (!!this.AttachFileAction.getFileCount.call(this)) {
                  await this.AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                }

                oSendObject.Prcty = 'C';

                const oUrl = await Client.deep(oModel, 'OtWorkApply', oSendObject);

                if (oUrl.ZappUrl) {
                  window.open(oUrl.ZappUrl, '_blank');
                }

                // {신청}되었습니다.
                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              }
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
        const oDetailModel = this.getViewModel();
        const [aDetailList] = oDetailModel.getProperty('/detail/list');
        const sAppno = _.isEmpty(aDetailList) ? '' : aDetailList.Appno;

        this.AttachFileAction.setAttachFile(this, {
          Editable: oDetailModel.getProperty('/Fixed'),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
