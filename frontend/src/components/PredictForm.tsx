import React, { useState } from 'react';
import api from '../services/api';

type PredictResult = {
  prediction?: any;
  probabilities?: number[][];
};

const PredictForm: React.FC = () => {
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(1.75);
  const [income, setIncome] = useState(5);
  const [smoker, setSmoker] = useState(false);
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age,
        weight,
        height,
        income_lpa: income,
        smoker,
        city,
        occupation,
      };
      const res = await api.predict(payload);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="predict-form card">
      <h2>AI Prediction</h2>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Age</label>
          <input type="number" value={age} onChange={(e)=>setAge(Number(e.target.value))} min={1} />
        </div>
        <div className="form-row">
          <label>Weight (kg)</label>
          <input type="number" value={weight} onChange={(e)=>setWeight(Number(e.target.value))} step="0.1" />
        </div>
        <div className="form-row">
          <label>Height (m)</label>
          <input type="number" value={height} onChange={(e)=>setHeight(Number(e.target.value))} step="0.01" />
        </div>
        <div className="form-row">
          <label>Income (LPA)</label>
          <input type="number" value={income} onChange={(e)=>setIncome(Number(e.target.value))} step="0.1" />
        </div>
        <div className="form-row">
          <label>Smoker</label>
          <input type="checkbox" checked={smoker} onChange={(e)=>setSmoker(e.target.checked)} />
        </div>
        <div className="form-row">
          <label>City</label>
          <input type="text" value={city} onChange={(e)=>setCity(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Occupation</label>
          <input type="text" value={occupation} onChange={(e)=>setOccupation(e.target.value)} />
        </div>

        <div className="form-row">
          <button type="submit" className="btn" disabled={loading}>{loading? 'Predicting...' : 'Predict'}</button>
        </div>
      </form>

      {error && <div className="alert error">{error}</div>}

      {result && (
        <div className="result">
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PredictForm;
