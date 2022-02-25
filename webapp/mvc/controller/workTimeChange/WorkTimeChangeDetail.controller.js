/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
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
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTimeChange.WorkTimeChangeDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          Fixed: true,
          timeEdit: true,
          DelBtn: false,
          FieldLimit: {},
          employees: [],
          DeletedRows: [],
          CauseType: [],
          detail: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          appTypeList: [
            {
              Appty: '1',
              Apptxt: this.getBundleText('LABEL_00116'), // 확정
            },
            {
              Appty: '2',
              Apptxt: this.getBundleText('LABEL_00109'), // 변경
            },
            {
              Appty: '3',
              Apptxt: this.getBundleText('LABEL_00118'), // 취소
            },
          ],
          dialog: {},
          busy: false,
        };
      },

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId('workTimeTable'),
          aColIndices: [0, 1, 2, 3, 4, 5, 11, 12],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        oDetailModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtworkChangeApply')));
          oDetailModel.setProperty('/busy', true);

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oDetailModel.setProperty('/detail', {
              listMode: 'MultiToggle',
              list: [],
              rowCount: 1,
            });
            oDetailModel.setProperty('/Fixed', true);
            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            const oTargetData = await Client.getEntitySet(oModel, 'OtworkChangeApply', {
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
              name: 'sap.ui.yesco.mvc.view.workTimeChange.fragment.WorkTimeDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          const oDetailModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sPernr = this.getAppointeeProperty('Pernr');

          this._pDetailDialog.then(async function (oDialog) {
            // 실적조회
            const aOtpList = await Client.create(oModel, 'OtworkChangeApply', {
              Prcty: 'D',
              Datum: new Date(),
              Pernr: sPernr,
            });

            oDetailModel.setProperty('/dialog', {
              ...aOtpList,
              Appty: '2',
            });
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

      // Dialog 저장
      onDialogSavBtn() {
        if (this.checkError()) {
          return;
        }

        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/dialog');
        const aDetailList = oDetailModel.getProperty('/detail/list');
        const aList = [...aDetailList, mDialogData];
        const iLength = _.size(aList);

        oDetailModel.setProperty('/detail/list', aList);
        oDetailModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
        this.byId('detailDialog').close();
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // Dialog 근무시간
      async onTimePicker() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/dialog');

        if (!_.parseInt(mDialogData.Enduz)) {
          return;
        }

        // 초과시간
        const oOverTime = await this.overTime();

        oDetailModel.setProperty('/dialog/Abrst', oOverTime.Abrst);
      },

      // Dialog 근무일
      async onWorkDatePicker() {
        const oDetailModel = this.getViewModel();
        const dDate = oDetailModel.getProperty('/dialog/Datum');

        if (!dDate) {
          return;
        }

        const oModel = this.getModel(ServiceNames.WORKTIME);
        const sPernr = this.getAppointeeProperty('Pernr');
        // 실적조회
        const aOtpList = await Client.create(oModel, 'OtworkChangeApply', {
          Prcty: 'D',
          Datum: dDate,
          Pernr: sPernr,
        });

        oDetailModel.setProperty('/dialog', { ...aOtpList, Appty: oDetailModel.getProperty('/dialog/Appty') });

        if (!_.parseInt(oDetailModel.getProperty('/dialog/Enduz'))) {
          return;
        }

        // 초과시간
        const oOverTime = await this.overTime();

        oDetailModel.setProperty('/dialog/Abrst', oOverTime.Abrst);
      },

      // 신청구분 선택시
      onApptype(oEvent) {
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();
        let bEdit = true;

        if (sKey === '2') {
          bEdit = true;
        } else {
          const mDialogData = oDetailModel.getProperty('/dialog');

          oDetailModel.setProperty('/dialog', {
            ...mDialogData,
            Beguz: mDialogData.BeguzB,
            Enduz: mDialogData.EnduzB,
            Abrst: mDialogData.AbrstB,
          });

          bEdit = false;
        }

        oDetailModel.setProperty('/timeEdit', bEdit);
      },

      // Dialog 초과근무시간
      overTime() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/dialog');
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
          Prcty: 'T',
          Datum: mDialogData.Datum,
          Beguz: mDialogData.Beguz,
          Enduz: mDialogData.Enduz,
        };

        return Client.create(oModel, 'OtworkChangeApply', mPayLoad);
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mDialogData = oDetailModel.getProperty('/dialog');

        // 근무일
        if (!mDialogData.Datum) {
          MessageBox.alert(this.getBundleText('MSG_27008'));
          return true;
        }

        // 근무시간
        if (mDialogData.Abrst === '0' || !mDialogData.Abrst) {
          MessageBox.alert(this.getBundleText('MSG_27005'));
          return true;
        }

        // 사유
        if (!mDialogData.Atrsn) {
          MessageBox.alert(this.getBundleText('MSG_27009'));
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
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
              const sAppno = await Appno.get.call(this);
              const oModel = this.getModel(ServiceNames.WORKTIME);
              const aDetailList = _.each(oDetailModel.getProperty('/detail/list'), (e) => {
                e.Beguz = e.Beguz;
                e.Enduz = e.Enduz;
              });
              let oSendObject = {
                ...aDetailList[0],
                Appno: sAppno,
                Appda: new Date(),
                Menid: this.getCurrentMenuId(),
                Prcty: 'V',
                OtWorkNav: aDetailList,
              };

              const oCheck = await Client.deep(oModel, 'OtworkChangeApply', oSendObject);

              if (!!oCheck.Retmsg) {
                AppUtils.setAppBusy(false, this);
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
                      AppUtils.setAppBusy(true, this);

                      // FileUpload
                      if (!!AttachFileAction.getFileCount.call(this)) {
                        await AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                      }

                      oSendObject.Prcty = 'C';

                      const oUrl = await Client.deep(oModel, 'OtworkChangeApply', oSendObject);

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
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                }

                oSendObject.Prcty = 'C';

                const oUrl = await Client.deep(oModel, 'OtworkChangeApply', oSendObject);

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
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const [aDetailList] = oDetailModel.getProperty('/detail/list');
        const sAppno = _.isEmpty(aDetailList) ? '' : aDetailList.Appno;

        AttachFileAction.setAttachFile(this, {
          Editable: oDetailModel.getProperty('/Fixed'),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
