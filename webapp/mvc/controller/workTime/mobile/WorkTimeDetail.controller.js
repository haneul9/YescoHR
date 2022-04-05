/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.mobile.WorkTimeDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          Fixed: true,
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
          dialog: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          busy: false,
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        oDetailModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtWorkApply')));
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

          // 근무 사유
          const aCauseList = await Client.getEntitySet(oModel, 'WorktimeCodeList', {
            Datum: new Date(),
            Cdnum: 'TM0003',
            Grcod: 'TM000003',
          });

          oDetailModel.setProperty('/CauseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCauseList }));

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

          this.onAddDetail();

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      // 근무시간
      formatTime(sTime1 = '', sTime2 = '', sTime3) {
        sTime1 = !sTime1 ? '0' : `${sTime1.slice(-4, -2)}:${sTime1.slice(-2)}`;
        sTime2 = !sTime2 ? '0' : `${sTime2.slice(-4, -2)}:${sTime2.slice(-2)}`;

        return sTime1 + '~' + sTime2 + '(' + sTime3 + ')';
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
        setTimeout(() => {
          const oDetailModel = this.getViewModel();
          const oEmpData = this.getAppointeeData();

          let aList = [];
          let iLength = 1;

          oDetailModel.setProperty('/DialogData', {
            Datum: new Date(),
            Beguz: '18:00',
            Abrst: '',
            Ottyp: 'ALL',
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
        }, 100);
      },

      // 신청내역 삭제
      onDelDetail() {
        const oDetailModel = this.getViewModel();

        const oList = this.byId('DetailList').getSelectedContexts();

        if (_.isEmpty(oList)) {
          // 삭제할 데이터를 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_00055'));
          return;
        }

        const aDelList = _.map(oList, (e) => {
          return oDetailModel.getProperty(e.sPath);
        });

        const aDiffList = _.difference(oDetailModel.getProperty('/detail/list'), aDelList);
        const iLength = _.size(aDiffList);

        oDetailModel.setProperty('/detail/list', aDiffList);
        oDetailModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
        this.byId('DetailList').removeSelections(true);
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
        ).then(() => {
          this.onAddDetail();
        });
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
              e.Atrsn = mDialogData.Atrsn;
            })
            .value(),
        ];

        const iLength = _.size(aFilterList);

        oDetailModel.setProperty('/detail/list', aFilterList);
        oDetailModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
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

        oDetailModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
        oDetailModel.setProperty('/DialogData/Notes', oOverTime.Notes);
      },

      // Dialog 근무일
      async onWorkDatePicker() {
        const oDetailModel = this.getViewModel();

        if (!oDetailModel.getProperty('/DialogData/Datum')) {
          return;
        }

        // 초과시간
        const oOverTime = await this.overTime();

        oDetailModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
        oDetailModel.setProperty('/DialogData/Notes', oOverTime.Notes);
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
              AppUtils.setAppBusy(true, this);

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
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
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
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
