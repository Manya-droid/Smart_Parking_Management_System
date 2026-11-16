// controllers/sessionController.js
import {
  checkInWalkIn,
  initiateCheckout,
  confirmPayment,
  getActiveSessions,
  getSessionHistory,
  checkOut,
  getMyCurrentSession,
  getMyHistory,
} from "../services/sessionService.js";
import { broadcastSlotChange } from "../socket.js";
// purana handleCheckOut hata ke ye 2 naye:
export async function handleInitiateCheckout(req, res) {
  try {
    const { vehicleNumber } = req.body;
    const result = await initiateCheckout({ vehicleNumber });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleConfirmPayment(req, res) {
  try {
    const { vehicleNumber, paymentMethod } = req.body;
    const result = await confirmPayment({ vehicleNumber, paymentMethod });
    await broadcastSlotChange(result.slot);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleCheckIn(req, res) {
  try {
    const { name, phoneNumber, vehicleNumber, vehicleType, preferredZone } =
      req.body;
    const result = await checkInWalkIn({
      name,
      phoneNumber,
      vehicleNumber,
      vehicleType,
      preferredZone:
        typeof preferredZone === "string" && preferredZone
          ? preferredZone
          : null,
    });
    await broadcastSlotChange(result.slot);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
export async function handleActiveSessions(req, res) {
  try {
    res.json(await getActiveSessions());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleSessionHistory(req, res) {
  try {
    res.json(await getSessionHistory());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export async function handleMyCurrentSession(req, res) {
  try {
    res.json(await getMyCurrentSession(req.admin.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleMyHistory(req, res) {
  try {
    res.json(await getMyHistory(req.admin.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
// export async function handleCheckOut(req, res) {
//   try {
//     const { vehicleNumber } = req.body;
//     const result = await checkOut({ vehicleNumber });
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(400).json({ error: err.message });

//   }
// }
