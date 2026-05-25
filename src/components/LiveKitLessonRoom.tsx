"use client";

import { LiveKitRoom, ParticipantTile, RoomAudioRenderer, TrackLoop, useLocalParticipant, useTracks } from "@livekit/components-react";
import { Mic, MicOff, MonitorUp, Play, ScreenShare, Video, VideoOff } from "lucide-react";
import { Track, VideoPresets, ScreenSharePresets } from "livekit-client";
import { useMemo, useState } from "react";

type LiveKitLessonRoomProps = {
  isObserver?: boolean;
  lessonId: string;
  participantId: string;
  participantName: string;
  participantRole: "STUDENT" | "TEACHER" | "ADMIN";
};

type TokenResponse = {
  roomName: string;
  serverUrl: string;
  token: string;
};

function LessonVideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: false },
  ]);

  const sortedTracks = useMemo(
    () =>
      tracks.filter((track) => track.publication && !track.publication.isMuted).sort((left, right) => {
        const leftIsScreen = left.source === Track.Source.ScreenShare ? 0 : 1;
        const rightIsScreen = right.source === Track.Source.ScreenShare ? 0 : 1;
        return leftIsScreen - rightIsScreen;
      }),
    [tracks],
  );

  return (
    <div className={`livekit-video-grid tiles-${Math.max(sortedTracks.length, 1)}`}>
      <TrackLoop tracks={sortedTracks}>
        <ParticipantTile />
      </TrackLoop>
    </div>
  );
}

function LessonCallDock({ canPublish }: { canPublish: boolean }) {
  const { isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant();

  if (!canPublish) return null;

  return (
    <div className="livekit-control-bar" aria-label="Управление видеозвонком" data-no-translate>
      <button
        aria-label={isMicrophoneEnabled ? "Выключить микрофон" : "Включить микрофон"}
        className={isMicrophoneEnabled ? "active" : ""}
        onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        type="button"
      >
        {isMicrophoneEnabled ? <Mic aria-hidden="true" size={20} /> : <MicOff aria-hidden="true" size={20} />}
      </button>
      <button
        aria-label={isCameraEnabled ? "Выключить камеру" : "Включить камеру"}
        className={isCameraEnabled ? "active" : ""}
        onClick={() =>
          void localParticipant.setCameraEnabled(
            !isCameraEnabled,
            !isCameraEnabled
              ? {
                  frameRate: 30,
                  resolution: VideoPresets.h720.resolution,
                }
              : undefined,
          )
        }
        type="button"
      >
        {isCameraEnabled ? <Video aria-hidden="true" size={20} /> : <VideoOff aria-hidden="true" size={20} />}
      </button>
      <button
        aria-label={isScreenShareEnabled ? "Отключить демонстрацию экрана" : "Включить демонстрацию экрана"}
        className={isScreenShareEnabled ? "active" : ""}
        onClick={() =>
          void localParticipant.setScreenShareEnabled(
            !isScreenShareEnabled,
            !isScreenShareEnabled
              ? {
                  contentHint: "detail",
                  resolution: ScreenSharePresets.h1080fps15.resolution,
                }
              : undefined,
            !isScreenShareEnabled
              ? {
                  screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
                  screenShareSimulcastLayers: [ScreenSharePresets.h720fps15, ScreenSharePresets.h1080fps15],
                }
              : undefined,
          )
        }
        type="button"
      >
        <MonitorUp aria-hidden="true" size={20} />
      </button>
    </div>
  );
}

export function LiveKitLessonRoom({
  isObserver = false,
  lessonId,
  participantId,
  participantName,
  participantRole,
}: LiveKitLessonRoomProps) {
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [status, setStatus] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const canPublish = !isObserver && participantRole !== "ADMIN";

  async function startCall() {
    if (!lessonId || isStarting) return;

    setIsStarting(true);
    setStatus("Подключаем видеокомнату...");
    try {
      const response = await fetch(`/api/lessons/${lessonId}/livekit-token`, {
        body: JSON.stringify({
          participantId,
          participantName,
          participantRole,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("LiveKit token request failed");
      }

      setTokenData((await response.json()) as TokenResponse);
      setStatus("");
    } catch {
      setStatus("Видеозвонок пока не настроен. Сообщите администратору платформы.");
    } finally {
      setIsStarting(false);
    }
  }

  if (!lessonId) {
    return (
      <div className="livekit-room-empty">
        <VideoOff aria-hidden="true" size={28} />
        <span>Урок не найден</span>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="livekit-room-empty livekit-start-panel">
        <div className="livekit-start-copy">
          <Video aria-hidden="true" size={34} />
          <span>{canPublish ? "Видеоурок готов к запуску" : "Наблюдение за видеоуроком"}</span>
          <strong>{canPublish ? "Проверьте микрофон, камеру и экран перед входом" : "Нажмите запуск, чтобы подключиться без камеры и микрофона"}</strong>
        </div>
        <div className="livekit-preflight-controls" aria-label="Настройки видеозвонка">
          <button
            aria-label={microphoneEnabled ? "Выключить микрофон" : "Включить микрофон"}
            className={microphoneEnabled ? "active" : ""}
            data-tooltip={microphoneEnabled ? "Выключить микрофон" : "Включить микрофон"}
            disabled={!canPublish || isStarting}
            onClick={() => setMicrophoneEnabled((value) => !value)}
            type="button"
          >
            {microphoneEnabled ? <Mic aria-hidden="true" size={20} /> : <MicOff aria-hidden="true" size={20} />}
          </button>
          <button
            aria-label={cameraEnabled ? "Выключить камеру" : "Включить камеру"}
            className={cameraEnabled ? "active" : ""}
            data-tooltip={cameraEnabled ? "Выключить камеру" : "Включить камеру"}
            disabled={!canPublish || isStarting}
            onClick={() => setCameraEnabled((value) => !value)}
            type="button"
          >
            {cameraEnabled ? <Video aria-hidden="true" size={20} /> : <VideoOff aria-hidden="true" size={20} />}
          </button>
          <button
            aria-label={screenShareEnabled ? "Отключить экран" : "Включить демонстрацию экрана"}
            className={screenShareEnabled ? "active" : ""}
            data-tooltip={screenShareEnabled ? "Отключить экран" : "Включить демонстрацию экрана"}
            disabled={!canPublish || isStarting}
            onClick={() => setScreenShareEnabled((value) => !value)}
            type="button"
          >
            <MonitorUp aria-hidden="true" size={20} />
          </button>
          <button
            aria-label="Запустить видеозвонок"
            className="livekit-start-button"
            data-tooltip={isStarting ? "Запускаем видеозвонок" : "Запустить видеозвонок"}
            disabled={isStarting}
            onClick={startCall}
            type="button"
          >
            <Play aria-hidden="true" size={22} />
          </button>
        </div>
        {status ? <p className="livekit-start-status">{status}</p> : null}
      </div>
    );
  }

  return (
    <LiveKitRoom
      audio={canPublish && microphoneEnabled}
      className="livekit-lesson-room"
      connect
      data-lk-theme="default"
      onError={() => setStatus("Не удалось подключиться к видеокомнате.")}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
          screenShareSimulcastLayers: [ScreenSharePresets.h720fps15, ScreenSharePresets.h1080fps15],
          simulcast: true,
          videoEncoding: VideoPresets.h720.encoding,
          videoSimulcastLayers: [VideoPresets.h360, VideoPresets.h720],
        },
        videoCaptureDefaults: {
          frameRate: 30,
          resolution: VideoPresets.h720.resolution,
        },
      }}
      serverUrl={tokenData.serverUrl}
      screen={canPublish && screenShareEnabled}
      token={tokenData.token}
      video={
        canPublish && cameraEnabled
          ? {
              frameRate: 30,
              resolution: VideoPresets.h720.resolution,
            }
          : false
      }
    >
      <div className="livekit-room-head">
        <div>
          <span>{tokenData.roomName}</span>
          <strong>{canPublish ? "Видео 720p" : "Режим наблюдения"}</strong>
        </div>
        <div className="livekit-quality-note">
          <ScreenShare aria-hidden="true" size={16} />
          <span>Демонстрация экрана включена</span>
        </div>
      </div>
      <LessonVideoGrid />
      {status ? <div className="livekit-room-status">{status}</div> : null}
      <LessonCallDock canPublish={canPublish} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
