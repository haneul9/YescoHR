/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
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
  ],
  (
    // prettier 방지용 주석
    Fragment,
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.MedicalDetail', {
      DIALOG_FILE_ID: 'DialogAttFile',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          Werks: this.getAppointeeProperty('Werks') !== '2000',
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ReWriteBtn: false,
          ReWriteStat: false,
          ViewKey: '',
          sYear: '',
          previousName: '',
          FormData: {},
          DialogData: {},
          TargetDetails: {},
          RemoveFiles: [],
          HisList: [],
          TargetList: [],
          ReceiptType: [],
          HisDeleteDatas: [],
          Settings: {},
          DialogLimit: false,
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
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

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/ViewKey', sDataKey);

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'MedExpenseAppl')));
          oViewModel.setProperty('/FieldLimitPop', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'MedExpenseItem')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

          const aAppList = await this.getTargetList();

          oViewModel.setProperty('/TargetList', new ComboEntry({ codeKey: 'Kdsvh', valueKey: 'Znametx', aEntries: aAppList }));

          this.setFormData();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      formatDate(sDate = '') {
        sDate = !sDate || _.toNumber(sDate) === 0 ? '' : `${sDate.slice(0, 4)}.${sDate.slice(4, 6)}`;

        return sDate;
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // FormData Settings
      async setFormData() {
        const sWerks = this.getAppointeeProperty('Werks');
        const sCommMsg = `<br/><span style='color: #006bd3;'>※ </span>
          <span'>${this.getBundleText('MSG_05017')}</span>
          <span style='color: #006bd3; margin-left: -3px;'>${this.getBundleText('MSG_05018')}</span><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span style='color: #006bd3;'>${this.getBundleText('MSG_05019')}</span><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span>${this.getBundleText('MSG_05020')}</span>`;
        let sMsg = '';

        if (sWerks === '2000') {
          sMsg = `<p>${this.getBundleText('MSG_09002')}</p>
            <p>${this.getBundleText('MSG_09003')}</p>
            <p>${this.getBundleText('MSG_09004')}</p>
            <p>${this.getBundleText('MSG_09005')}</p>
            <ul>
              <li>${this.getBundleText('MSG_09006')}
                <ul>
                  <li>${this.getBundleText('MSG_09007')}</li>
                  <li>${this.getBundleText('MSG_09008')}</li>
                  <li>${this.getBundleText('MSG_09009')}</li>
                  <li>${this.getBundleText('MSG_09010')}</li>
                  <li>${this.getBundleText('MSG_09011')}</li>
                  <li>${this.getBundleText('MSG_09012')}</li>
                  <li>${this.getBundleText('MSG_09013')}</li>
                  <li>${this.getBundleText('MSG_09014')}</li>
                </ul>
              </li>
            </ul>
            <p>${this.getBundleText('MSG_09015')}</p>
            ${sCommMsg}`;
        } else if (sWerks === '1000' || sWerks === '4000' || sWerks === '5000') {
          sMsg = `<ol>
            <li>${this.getBundleText('MSG_09029')}</il>
            <li>${this.getBundleText('MSG_09030')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09031')}</li>
              <li>${this.getBundleText('MSG_09032')}</li>
            </ul>
            <li>${this.getBundleText('MSG_09033')}</il>
            <li>${this.getBundleText('MSG_09034')}</il>
            <li>${this.getBundleText('MSG_09035')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09036')}</li>
              <li>${this.getBundleText('MSG_09037')}</li>
              <li>${this.getBundleText('MSG_09038')}</li>
            </ul>
            <li>${this.getBundleText('MSG_09039')}</il>
            <ul>
              <li>${this.getBundleText('MSG_09040')}</li>
              ${this.getBundleText('MSG_09041')}
              <li>${this.getBundleText('MSG_09042')}</li>
              <li>${this.getBundleText('MSG_09043')}</li>
              <li>${this.getBundleText('MSG_09044')}</li>
              <li>${this.getBundleText('MSG_09045')}</li>
              <li>${this.getBundleText('MSG_09046')}</li>
              <li>${this.getBundleText('MSG_09047')}</li>
            </ul>
          </ol>
          ${sCommMsg}`;
        } else if (sWerks === '3000') {
          sMsg = `<dl>
            <dt>${this.getBundleText('MSG_09002')}</dt>
            <dd>${this.getBundleText('MSG_09048')}</dd>
            <dt>${this.getBundleText('MSG_09004')}</dt>
            <br>
            <dt>${this.getBundleText('MSG_09005')}</dt>
            <dt>${this.getBundleText('LABEL_09025')}</dt>
              <dd>${this.getBundleText('MSG_09049')}</dd>
              <dd>${this.getBundleText('MSG_09050')}</dd>
              <dd>${this.getBundleText('MSG_09051')}</dd>
              <dd>${this.getBundleText('MSG_09052')}</dd>
            <dt>${this.getBundleText('LABEL_09026')}</dt>
              <dd>${this.getBundleText('MSG_09053')}</dd>
              <dd>${this.getBundleText('MSG_09054')}</dd>
              <dd>${this.getBundleText('MSG_09055')}</dd>
              <dd>${this.getBundleText('MSG_09056')}</dd>
              <dd>${this.getBundleText('MSG_09057')}</dd>
              <dd>${this.getBundleText('MSG_09058')}</dd>
              <dd>${this.getBundleText('MSG_09059')}</dd>
          </dl>`;
        }

        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/InfoMessage', sMsg);

        const [oTotal] = await this.getTotalYear();

        oViewModel.setProperty('/sYear', oTotal.Zyear);

        const sViewKey = oViewModel.getProperty('/ViewKey');

        if (sViewKey === 'N' || !sViewKey) {
          const mAppointeeData = this.getAppointeeData();

          oViewModel.setProperty('/FormData', {
            Pernr: mAppointeeData.Pernr,
            Kdsvh: 'ALL',
            Apcnt: '0',
            Pvcnt: '0',
            Rjcnt: '0',
            Pyyea: oTotal.Zyear,
          });

          const mSessionData = this.getSessionData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mSendObject = {
            Pernr: this.getAppointeeProperty('Pernr'),
            Prcty: 'D',
            Appno: sViewKey,
            MedExpenseItemSet: [],
          };

          const oTargetData = await Client.create(oModel, 'MedExpenseAppl', mSendObject);
          const aHisList = oTargetData.MedExpenseItemSet.results;

          oViewModel.setProperty('/FormData', oTargetData);
          oViewModel.setProperty('/ApplyInfo', oTargetData);
          oViewModel.setProperty('/TargetDetails', oTargetData);
          oViewModel.setProperty('/HisList', aHisList);
          oViewModel.setProperty(
            '/ReWriteBtn',
            !!_.find(aHisList, (e) => {
              return e.ZappStat === 'F';
            })
          );
          const iHisLength = aHisList.length;

          oViewModel.setProperty('/listInfo', {
            rowCount: iHisLength > 10 ? 10 : iHisLength,
          });

          this.getReceiptList(oTargetData.Famgb, oTargetData.Adult);
        }

        this.settingsAttachTable();
      },

      async getTotalYear() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return await Client.getEntitySet(oModel, 'MedExpenseMymed', { Pernr: this.getAppointeeProperty('Pernr') });
      },

      async getReceiptList(sKey, sAdult) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const sWerks = this.getSessionProperty('Werks');
        const sViewKey = this.getViewModel().getProperty('/ViewKey');
        let sAppno = '';
        let sPyyea = '';

        if (!!sViewKey && sViewKey !== 'N') {
          const mFormData = oViewModel.getProperty('/FormData');

          sAppno = mFormData.Appno;
          sKey = mFormData.Famgb;
          sAdult = mFormData.Adult;
          sPyyea = mFormData.Pyyea;
        } else {
          const [oYearData] = await Client.getEntitySet(oModel, 'MedExpenseMymed');

          sPyyea = oYearData.Zyear;
        }

        const mPayLoad = {
          Adult: sAdult,
          Famgb: sKey,
          Werks: sWerks,
          Pyyea: sPyyea,
          Appno: sAppno,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        const aReceiptList = await Client.getEntitySet(oModel, 'MedExpenseReceiptList', mPayLoad);

        // 영수증구분
        oViewModel.setProperty('/ReceiptType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aReceiptList }));
      },

      async getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mPayLoad = {
          Datum: new Date(),
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'MedExpenseSupportList', mPayLoad);
      },

      // 신청대상 선택시
      async onTargetList(oEvent) {
        const oViewModel = this.getViewModel();
        const sTargetPath = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
        const mSelectedDetail = oViewModel.getProperty(sTargetPath);

        oViewModel.setProperty('/TargetDetails', mSelectedDetail);
        oViewModel.setProperty('/FormData/Adult', mSelectedDetail.Adult);
        oViewModel.setProperty('/FormData/Zname', mSelectedDetail.Zname);
        oViewModel.setProperty('/FormData/Znametx', mSelectedDetail.Znametx);
        oViewModel.setProperty('/FormData/Famsa', mSelectedDetail.Famsa);
        oViewModel.setProperty('/FormData/Objps', mSelectedDetail.Objps);
        oViewModel.setProperty('/FormData/Kdsvh', mSelectedDetail.Kdsvh);
        oViewModel.setProperty('/FormData/Famgb', mSelectedDetail.Famgb);
        oViewModel.setProperty('/FormData/Pratetx', mSelectedDetail.Pratetx);
        oViewModel.setProperty('/FormData/Prate', mSelectedDetail.Prate);

        if (oEvent.getSource().getSelectedItem().getBindingContext().getPath().substr(-1) === '0') {
          return;
        }

        oViewModel.setProperty('/HisList', []);
        oViewModel.setProperty('/listInfo/rowCount', 0);
        this.getReceiptList(mSelectedDetail.Famgb, mSelectedDetail.Adult);
      },

      // 신청액 & 신청건수
      setAppAmount() {
        const oViewModel = this.getViewModel();
        const aSumAmount = oViewModel.getProperty('/HisList').map((a) => a.Bettot);

        if (!aSumAmount.length) return;

        const iAmount = aSumAmount.reduce((acc, cur) => {
          return parseInt(acc) + parseInt(cur);
        });

        _.chain(oViewModel.getProperty('/FormData'))
          // prettier 방지
          .set('Apbet', String(iAmount))
          .set('Apcnt', String(aSumAmount.length))
          .commit();
      },

      // 상세내역 No
      addSeqnrNum() {
        const oViewModel = this.getViewModel();
        const aHisList = oViewModel.getProperty('/HisList');
        let iSeqnr = 0;

        aHisList.forEach((e) => {
          iSeqnr += 1;
          e.Seqnr = String(iSeqnr);
        });

        oViewModel.setProperty('/HisList', aHisList);
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 신청대상
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_09025'));
          return true;
        }

        // 비고
        if (!mFormData.Zbigo) {
          MessageBox.alert(this.getBundleText('MSG_09026'));
          return true;
        }

        const aHisList = oViewModel.getProperty('/HisList');

        // 상세내역
        if (!aHisList.length) {
          MessageBox.alert(this.getBundleText('MSG_09027'));
          return true;
        }

        // 첨부파일
        const bResult = aHisList.every((e) => e.Attyn === 'X');

        if (!bResult && !AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_09028'));
          return true;
        }

        return false;
      },
      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/FormData/Appno', '');
        oViewModel.setProperty('/FormData/Lnsta', '');
        oViewModel.setProperty('/FormData/Pvbet', '0');
        oViewModel.setProperty('/FormData/Pvcnt', '0');
        oViewModel.setProperty('/FormData/Paymm', '');
        oViewModel.setProperty('/FormData/Rjbet', '0');
        oViewModel.setProperty('/FormData/Rjcnt', '0');
        oViewModel.setProperty('/FormData/ZappResn', '');
        oViewModel.setProperty('/ReWriteBtn', false);
        oViewModel.setProperty('/ReWriteStat', true);

        const aHisList = _.chain(oViewModel.getProperty('/HisList'))
          .filter((e) => {
            return e.ZappStat === 'F';
          })
          .each((e) => {
            e.ZappStat = '';
          })
          .value();

        oViewModel.setProperty('/HisList', aHisList);
        oViewModel.setProperty('/listInfo/rowCount', _.size(aHisList));
        this.setAppAmount();
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장
          title: this.getBundleText('LABEL_09010'),
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const aDeleteDatas = oViewModel.getProperty('/RemoveFiles');

              if (!!aDeleteDatas.length) {
                await aDeleteDatas.forEach((e) => {
                  AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                });
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: oViewModel.getProperty('/menid'),
                Waers: 'KRW',
                MedExpenseItemSet: oViewModel.getProperty('/HisList'),
              };

              await Client.create(oModel, 'MedExpenseAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) return;

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
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appda', new Date()).commit();
              }

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const aDeleteDatas = oViewModel.getProperty('/RemoveFiles');

              if (!!aDeleteDatas.length) {
                await aDeleteDatas.forEach((e) => {
                  AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                });
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oViewModel.getProperty('/menid'),
                Waers: 'KRW',
                MedExpenseItemSet: oViewModel.getProperty('/HisList'),
              };

              await Client.create(oModel, 'MedExpenseAppl', mSendObject);

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

      // 취소
      onCancelBtn() {
        // {취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          // 확인, 취소
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 취소
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            AppUtils.setAppBusy(true);

            const oModel = this.getModel(ServiceNames.BENEFIT);
            const oViewModel = this.getViewModel();
            const mSendObject = {
              ...oViewModel.getProperty('/FormData'),
              Prcty: 'W',
              Menid: oViewModel.getProperty('/menid'),
            };

            delete mSendObject.isNew;

            await Client.create(oModel, 'MedExpenseAppl', mSendObject);

            // {취소}되었습니다.
            MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
              onClose: () => {
                this.onNavBack();
              },
            });
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

            AppUtils.setAppBusy(true);

            const oModel = this.getModel(ServiceNames.BENEFIT);
            const oViewModel = this.getViewModel();

            await Client.remove(oModel, 'MedExpenseAppl', { Appno: oViewModel.getProperty('/FormData/Appno') });

            // {삭제}되었습니다.
            MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
              onClose: () => {
                this.onNavBack();
              },
            });
          },
        });
      },

      // Excel Copy to Dialog
      async excelCopy() {
        const sCopiedText = await window.navigator.clipboard.readText();
        const aTextList = sCopiedText.split('\t');
        const oDetailController = AppUtils.getAppComponent().byId('medicalDetail');
        const oViewModel = oDetailController.getModel();

        aTextList.forEach((e, i) => {
          switch (i) {
            // 진료기간 paste
            case 0:
              const oDateRange = oDetailController.byId(`DialogData${i + 1}`);
              const sDate = e.trim().replace(/[^\d]/g, '');
              const iDateLength = sDate.length;
              const iBaseYear = parseInt(oViewModel.getProperty('/sYear'));

              // 선택된 날짜에 '-'가 있는경우 ('20200101-20200202')
              if (iDateLength === 17) {
                const dDate = moment(moment(sDate.slice(0, 8)).format('YYYY-MM-DD')).toDate();
                const dSecendDate = moment(moment(sDate.slice(9)).format('YYYY-MM-DD')).toDate();
                const iDateYear = moment(dDate).year();
                const iSecDateYear = moment(dSecendDate).year();

                // 유효한 날짜체크
                if (iBaseYear !== iDateYear || iBaseYear !== iSecDateYear) {
                  MessageBox.alert(oDetailController.getController().getBundleText('MSG_09060', iBaseYear));
                  oDateRange.setDateValue(new Date());
                  oDateRange.setSecondDateValue(new Date());
                  return;
                }

                oDateRange.setDateValue(dDate);
                oDateRange.setSecondDateValue(dSecendDate);

                // 선택된 날짜에 '-'가 없는경우 ('2020010120200202')
              } else if (iDateLength === 16) {
                const dDate = moment(moment(sDate.slice(0, 8)).format('YYYY-MM-DD')).toDate();
                const dSecendDate = moment(moment(sDate.slice(8)).format('YYYY-MM-DD')).toDate();
                const iDateYear = moment(dDate).year();
                const iSecDateYear = moment(dSecendDate).year();

                // 유효한 날짜체크
                if (iBaseYear !== iDateYear || iBaseYear !== iSecDateYear) {
                  // 선택가능한 진료기간은 {0}년 입니다.
                  MessageBox.alert(oDetailController.getController().getBundleText('MSG_09060', iBaseYear));
                  oDateRange.setDateValue(new Date());
                  oDateRange.setSecondDateValue(new Date());
                  return;
                }

                oDateRange.setDateValue(dDate);
                oDateRange.setSecondDateValue(dSecendDate);
              }

              break;
            // 급여
            case 1:
              const oInput1 = oDetailController.byId(`DialogData${i + 1}`);
              const sCost1 = e.trim().replace(/[^\d]/g, '');

              oInput1.setValue(new Intl.NumberFormat('ko-KR').format(sCost1 || 0));
              oViewModel.setProperty('/DialogData/Bet01', sCost1);
              break;
            // 병명/진료과목
            case 2:
              const oInput2 = oDetailController.byId(`DialogData${i + 1}`);

              oInput2.setValue(e);
              break;
            // 비급여
            case 3:
              const oInput3 = oDetailController.byId(`DialogData${i + 1}`);
              const sCost2 = e.trim().replace(/[^\d]/g, '');

              oInput3.setValue(new Intl.NumberFormat('ko-KR').format(sCost2 || 0));
              oViewModel.setProperty('/DialogData/Bet02', sCost2);
              oViewModel.setProperty('/DialogData/Bettot', String(parseInt(sCost2) + parseInt(oViewModel.getProperty('/DialogData/Bet01'))));
              break;
            // 의료기관
            case 4:
              const oInput4 = oDetailController.byId(`DialogData${i + 1}`);

              oInput4.setValue(e);
              break;
            // 영수증구분
            case 5:
              const oInput5 = oDetailController.byId(`DialogData${i + 1}`);
              const sText = e.slice(0, e.search(`\r\n`));
              let bSucces = true;

              oViewModel.getProperty('/ReceiptType').forEach((ele) => {
                if (ele.Ztext === sText) {
                  oInput5.setValue(ele.Ztext);
                  oViewModel.setProperty('/DialogData/Recpgb', ele.Zcode);
                  bSucces = false;
                }
              });

              if (bSucces) {
                // 영수증 구분을 확인하세요.
                MessageBox.alert(oDetailController.getController().getBundleText('MSG_09016'));
                oViewModel.setProperty('/DialogData/Recpgb', 'ALL');
                return;
              }

              break;
          }
        });
      },

      // 상세내역 추가
      onAddDetails() {
        const oViewModel = this.getViewModel();
        const sAppTarget = oViewModel.getProperty('/FormData/Kdsvh');

        if (!sAppTarget || sAppTarget === 'ALL') {
          // 신청대상을 입력하세요.
          return MessageBox.alert(this.getBundleText('MSG_09023'));
        }

        oViewModel.setProperty('/DialogData', []);

        this.setDialogData();

        if (!this.byId('DetailHisDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.medical.fragment.DetailHisDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            this.settingsAttachDialog();
            this.byId('DialogData1').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData2').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData3').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData4').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData5').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData6').attachBrowserEvent('paste', this.excelCopy);

            oDialog.open();
          });
        } else {
          this.settingsAttachDialog();
          this.byId('DetailHisDialog').open();
        }
      },

      // 상세내역 삭제
      onDelDetails() {
        const oViewModel = this.getViewModel();
        const aDeleteDatas = oViewModel.getProperty('/HisDeleteDatas');

        if (!aDeleteDatas.length) {
          // {삭제}할 행을 선택하세요.
          return MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110'));
        }

        oViewModel.setProperty('/RemoveFiles', aDeleteDatas);
        const aHisList = oViewModel.getProperty('/HisList');
        const aNoInclued = aHisList.filter((e) => !aDeleteDatas.includes(e));
        const oHisTable = this.byId('medHisTable');

        oViewModel.setProperty('/HisList', aNoInclued);
        oViewModel.setProperty('/listInfo/rowCount', aNoInclued.length);
        oHisTable.clearSelection();
        this.setAppAmount();
        this.addSeqnrNum();
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/Lnsta');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },

      /*
       *******************************************************************************************
       *****************************DialogEvent***************************************************
       */

      // 진료내역 check
      checkClinicDetail() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        // 진료기간
        if (!mDialogData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_09018'));
          return true;
        }

        // 병명/진료과목
        if (!mDialogData.Disenm) {
          MessageBox.alert(this.getBundleText('MSG_09019'));
          return true;
        }

        // 의료기관명
        if (!mDialogData.Medorg) {
          MessageBox.alert(this.getBundleText('MSG_09020'));
          return true;
        }

        // 영수증 구분
        if (!mDialogData.Recpgb || mDialogData.Recpgb === 'ALL') {
          MessageBox.alert(this.getBundleText('MSG_09021'));
          return true;
        }

        // 금여 or 비급여
        if (!mDialogData.Bet01 && !mDialogData.Bet02) {
          MessageBox.alert(this.getBundleText('MSG_09022'));
          return true;
        }

        // 금여 or 비급여 한도체크
        if (oViewModel.getProperty('/DialogLimit')) {
          MessageBox.alert(this.getBundleText('MSG_09024'));
          return true;
        }

        const mReciptDetails = oViewModel.getProperty('/ReciptDetails');
        const mTargetDetails = oViewModel.getProperty('/TargetDetails');

        if (!!mReciptDetails) {
          // 급여인경우
          if (!!mDialogData.Bet01) {
            const iBet01 = parseInt(mReciptDetails.Bet01);
            const iActCost = parseInt(mDialogData.Bet01) * parseFloat(mTargetDetails.Prate);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              return true;
            }
          }

          if (!!mDialogData.Bet02) {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;
            const iActCost = parseInt(mDialogData.Bet02) * parseFloat(mTargetDetails.Prate);

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여 추가한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                return true;
              }
            } else {
              const iAddBet02 = parseInt(sAddBet02);

              if (iAddBet02 < iActCost) {
                // 비급여 한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
                return true;
              }
            }
          }
        }

        // 인사영역 2000번일경우는 첨부파일 필수
        if (this.getAppointeeProperty('Werks') === '2000' && !this.getViewModel(this.DIALOG_FILE_ID).getProperty('/Data').length) {
          MessageBox.alert(this.getBundleText('MSG_00046'));
          return true;
        }

        return false;
      },

      checkedDialogData(aDetailList = []) {
        aDetailList.forEach((e) => {
          e.Waers = 'KRW';
        });

        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSendObject = {
          ...oViewModel.getProperty('/FormData'),
          Prcty: '1',
          MedExpenseItemSet: aDetailList,
        };

        return Client.create(oModel, 'MedExpenseAppl', mSendObject);
      },

      // Dialog 등록
      async onHisRegBtn() {
        if (this.checkClinicDetail()) return;

        const oViewModel = this.getViewModel();

        try {
          const mDialogData = oViewModel.getProperty('/DialogData');

          AppUtils.setAppBusy(true);

          if (!mDialogData.Appno2 || _.parseInt(mDialogData.Appno2) === 0) {
            const sAppno = await Appno.get.call(this);

            _.set(mDialogData, 'Appno2', sAppno);
          }

          const aHisList = [_.set(mDialogData, 'Waers', 'KRW'), ...oViewModel.getProperty('/HisList')];
          const aDetail = [];

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          await this.checkedDialogData(aHisList);

          const oTable = this.byId('medHisTable');

          oViewModel.setProperty('/HisList', aDetail);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aHisList, sStatCode: 'ZappStat' }));

          this.setAppAmount();
          this.addSeqnrNum();

          await AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);
          let sFile = '';

          if (!!oDialogModel.getProperty('/DeleteDatas').length) {
            sFile = '';
          }

          if (!!oDialogModel.getProperty('/Data').length) {
            sFile = 'X';
          }

          oViewModel.setProperty('/DialogData/Attyn', sFile);
          this.byId('DetailHisDialog').close();
        } catch (oError) {
          oViewModel.setProperty('/DialogData/isNew', true);
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      // Dialog 수정
      async onHisUpBtn() {
        if (this.checkClinicDetail()) return;

        try {
          AppUtils.setAppBusy(true);

          const oViewModel = this.getViewModel();
          const mDialogData = oViewModel.getProperty('/DialogData');

          if (!mDialogData.Appno2 || (!mDialogData.Appno2 && !mDialogData.ZappStat) || _.parseInt(mDialogData.Appno2) === 0) {
            const sAppno = await Appno.get.call(this);

            _.set(mDialogData, 'Appno2', sAppno);
          }

          const aDetail = [];
          const aHisList = oViewModel.getProperty('/HisList');

          aHisList.forEach((e) => {
            if (e.Appno2 === mDialogData.Appno2) {
              e = mDialogData;
              e.Line = 'X';
            } else {
              e.Line = '';
            }
            aDetail.push(e);
          });

          await this.checkedDialogData(aDetail);
          await AttachFileAction.uploadFile.call(this, mDialogData.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);

          oViewModel.setProperty('/HisList', aDetail);

          const oDialogModel = this.getViewModel(this.DIALOG_FILE_ID);

          let sFile = '';

          if (!!oDialogModel.getProperty('/DeleteDatas').length) {
            sFile = '';
          }

          if (!!oDialogModel.getProperty('/Data').length) {
            sFile = 'X';
          }

          oViewModel.setProperty('/DialogData/Attyn', sFile);
          this.setAppAmount();
          this.byId('DetailHisDialog').close();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      // Dialog Close
      onDialogClose() {
        this.byId('DetailHisDialog').close();
      },

      // 급여 , 비급여 한도 비교
      liveCompar(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oViewModel = this.getViewModel();
        const mReciptDetails = oViewModel.getProperty('/ReciptDetails');
        const mTargetDetails = oViewModel.getProperty('/TargetDetails');
        const iValue = parseInt(sValue);
        const iActCost = iValue * parseFloat(mTargetDetails.Prate);
        let sAmount = sValue;

        oViewModel.setProperty('/DialogLimit', false);

        if (!!mReciptDetails) {
          // 급여인경우
          if (sPath === '/DialogData/Bet01') {
            const iBet01 = parseInt(mReciptDetails.Bet01);

            if (iBet01 < iActCost) {
              MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet01Basic, this.TextUtils.toCurrency(parseInt(iBet01 / parseFloat(mTargetDetails.Prate)))));
              oViewModel.setProperty('/DialogLimit', true);
            }
          } else {
            const iBet02 = parseInt(mReciptDetails.Bet02);
            const sAddBet02 = mReciptDetails.Bet02Add;

            if ((sAddBet02 === '0' || !sAddBet02) && !mReciptDetails.Bet02AddChk) {
              if (iBet02 < iActCost) {
                // 비급여 추가한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02Basic, this.TextUtils.toCurrency(parseInt(iBet02 / parseFloat(mTargetDetails.Prate)))));
                oViewModel.setProperty('/DialogLimit', true);
              }
            } else {
              const iAddBet02 = parseInt(sAddBet02);

              if (iAddBet02 < iActCost) {
                // 비급여 한도를 초과했을경우
                MessageBox.alert(this.getBundleText('MSG_09017', mReciptDetails.Bet02AddBasic, this.TextUtils.toCurrency(parseInt(iAddBet02 / parseFloat(mTargetDetails.Prate)))));
                oViewModel.setProperty('/DialogLimit', true);
              }
            }
          }
        }

        oEventSource.setValue(this.TextUtils.toCurrency(sAmount));
        oViewModel.setProperty(sPath, !sAmount ? '0' : sAmount);

        setTimeout(() => {
          const mDialogData = oViewModel.getProperty('/DialogData');
          const iBet01 = parseInt(mDialogData.Bet01) || 0;
          const iBet02 = parseInt(mDialogData.Bet02) || 0;

          oViewModel.setProperty('/DialogData/Bettot', String(iBet01 + iBet02));
        }, 100);
      },

      // 상세내역 Click
      onDetailsRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = oViewModel.getProperty(vPath);

        this.setDialogData(oRowData);

        if (!this.byId('DetailHisDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.medical.fragment.DetailHisDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            this.settingsAttachDialog();
            this.byId('DialogData1').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData2').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData3').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData4').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData5').attachBrowserEvent('paste', this.excelCopy);
            this.byId('DialogData6').attachBrowserEvent('paste', this.excelCopy);

            oDialog.open();
          });
        } else {
          this.settingsAttachDialog();
          this.byId('DetailHisDialog').open();
        }
      },

      // 상세내역Table checkbox
      onRowSelection(oEvent) {
        const aSelected = oEvent.getSource().getSelectedIndices();

        if (!aSelected) return;

        const oViewModel = this.getViewModel();
        const aDeleteDatas = [];

        oViewModel.setProperty('/HisDeleteDatas', []);

        aSelected.forEach((e) => {
          aDeleteDatas.push(oViewModel.getProperty(`/HisList/${e}`));
        });

        oViewModel.setProperty('/HisDeleteDatas', aDeleteDatas);
      },

      // 영수증 구분선택시 데이터 셋팅
      onRecipt(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();

        oViewModel.getProperty('/ReceiptType').forEach((e) => {
          if (sKey === e.Zcode) {
            oViewModel.setProperty('/ReciptDetails', e);
            oViewModel.setProperty('/DialogData/Recpgbtx', e.Ztext);
          }
        });
      },

      // Dialog SettingData
      async setDialogData(mRowData) {
        const oViewModel = this.getViewModel();

        if (!mRowData) {
          oViewModel.setProperty('/DialogData', {
            Recpgb: 'ALL',
            Pratetx: oViewModel.getProperty('/FormData/Pratetx'),
            Prate: oViewModel.getProperty('/FormData/Prate'),
            isNew: true,
          });

          oViewModel.setProperty('/ReWriteStat', true);
        } else {
          const sLnsta = oViewModel.getProperty('/FormData/Lnsta');
          const bRewrit = !mRowData.ZappStat && (!sLnsta || sLnsta === '10');

          oViewModel.setProperty('/ReWriteStat', bRewrit);
          oViewModel.setProperty('/DialogData', _.cloneDeep(mRowData));
          oViewModel.setProperty('/DialogData/isNew', false);
        }

        const dBegda = oViewModel.getProperty('/DialogData/Begda');
        const iYear = dBegda ? moment(dBegda).year() : parseInt(oViewModel.getProperty('/sYear'));

        oViewModel.setProperty('/DialogData/minDate', new Date(iYear, 0, 1));
        oViewModel.setProperty('/DialogData/maxDate', new Date());
      },

      // Dialog AttachFileTable Settings
      settingsAttachDialog() {
        const oViewModel = this.getViewModel();
        const sAppno = oViewModel.getProperty('/DialogData/Appno2') || '';

        AttachFileAction.setAttachFile(this, {
          Id: this.DIALOG_FILE_ID,
          Editable: oViewModel.getProperty('/ReWriteStat'),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 1,
        });
      },
    });
  }
);
