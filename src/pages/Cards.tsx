import React, { useState } from 'react';
import styles from './Cards.module.scss';
import cardsService from '../services/cardsService';
import walletsService from '../services/walletsService';

const Cards: React.FC = () => {
  const [uidLookup, setUidLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [uidBind, setUidBind] = useState('');
  const [codigoClienteBind, setCodigoClienteBind] = useState('');
  const [bindStatus, setBindStatus] = useState<string | null>(null);

  const [uidAnon, setUidAnon] = useState('');
  const [anonCardId, setAnonCardId] = useState<number | null>(null);
  const [anonStatus, setAnonStatus] = useState<string | null>(null);

  const [topupCardId, setTopupCardId] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupStatus, setTopupStatus] = useState<string | null>(null);

  const handleLookup = async () => {
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await cardsService.lookup(uidLookup);
      setLookupResult(res);
    } catch (e: any) {
      setLookupError(e?.response?.data?.detail || 'No se pudo consultar la tarjeta');
    }
  };

  const handleBind = async () => {
    setBindStatus(null);
    try {
      const res = await cardsService.bind({ uid: uidBind, codigo_cliente: codigoClienteBind || undefined });
      setBindStatus(`OK: ${res.message} (card_id=${res.card_id})`);
    } catch (e: any) {
      setBindStatus(e?.response?.data?.detail || 'No se pudo vincular la tarjeta');
    }
  };

  const handleIssueAnonymous = async () => {
    setAnonStatus(null);
    try {
      const res = await cardsService.issueAnonymous(uidAnon);
      setAnonCardId(res.card_id);
      setTopupCardId(String(res.card_id));
      setAnonStatus(`OK: ${res.message} (card_id=${res.card_id})`);
    } catch (e: any) {
      setAnonStatus(e?.response?.data?.detail || 'No se pudo emitir la tarjeta');
    }
  };

  const handleTopup = async () => {
    setTopupStatus(null);
    const cardIdNumber = Number(topupCardId);
    if (!cardIdNumber || cardIdNumber <= 0) {
      setTopupStatus('Ingresá un card_id válido');
      return;
    }
    try {
      const res = await walletsService.topupAnonymous(cardIdNumber, topupAmount);
      setTopupStatus(`OK: ${res.message}`);
    } catch (e: any) {
      setTopupStatus(e?.response?.data?.detail || 'No se pudo cargar saldo');
    }
  };

  return (
    <div className={styles.cards}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tarjetas y Saldo</h1>
        <p className={styles.subtitle}>Vinculá beCard, emití tarjeta anónima y cargá saldo</p>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Consultar UID</h2>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={uidLookup}
              onChange={(e) => setUidLookup(e.target.value)}
              placeholder="UID (NFC/RFID)"
            />
            <button className={styles.button} onClick={handleLookup} disabled={!uidLookup.trim()}>
              Consultar
            </button>
          </div>
          {lookupError && <div className={styles.error}>{lookupError}</div>}
          {lookupResult && (
            <div className={styles.result}>
              <div>Estado: {lookupResult.card_status}</div>
              {lookupResult.display_name && <div>Nombre: {lookupResult.display_name}</div>}
              {lookupResult.balance && <div>Saldo: {lookupResult.balance}</div>}
              {lookupResult.card_id && <div>card_id: {lookupResult.card_id}</div>}
            </div>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Vincular beCard</h2>
          <div className={styles.column}>
            <input
              className={styles.input}
              value={uidBind}
              onChange={(e) => setUidBind(e.target.value)}
              placeholder="UID (NFC/RFID)"
            />
            <input
              className={styles.input}
              value={codigoClienteBind}
              onChange={(e) => setCodigoClienteBind(e.target.value)}
              placeholder="Código cliente (QR) ej: BC-XXXXXX"
            />
            <button className={styles.button} onClick={handleBind} disabled={!uidBind.trim() || !codigoClienteBind.trim()}>
              Vincular
            </button>
          </div>
          {bindStatus && <div className={styles.result}>{bindStatus}</div>}
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Emitir tarjeta anónima</h2>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={uidAnon}
              onChange={(e) => setUidAnon(e.target.value)}
              placeholder="UID (NFC/RFID)"
            />
            <button className={styles.button} onClick={handleIssueAnonymous} disabled={!uidAnon.trim()}>
              Emitir
            </button>
          </div>
          {anonStatus && <div className={styles.result}>{anonStatus}</div>}
          {anonCardId && <div className={styles.muted}>Usá card_id={anonCardId} para cargar saldo</div>}
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Cargar saldo (anónima)</h2>
          <div className={styles.column}>
            <input
              className={styles.input}
              value={topupCardId}
              onChange={(e) => setTopupCardId(e.target.value)}
              placeholder="card_id"
            />
            <input
              className={styles.input}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Monto (ej: 500.00)"
            />
            <button className={styles.button} onClick={handleTopup} disabled={!topupCardId.trim() || !topupAmount.trim()}>
              Cargar
            </button>
          </div>
          {topupStatus && <div className={styles.result}>{topupStatus}</div>}
        </section>
      </div>
    </div>
  );
};

export default Cards;

