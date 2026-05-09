import { Image, StyleSheet, Text, View } from 'react-native';

import { Card } from './Card.js';
import { PrimaryButton } from './PrimaryButton.js';
import { StatusNotice } from './StatusNotice.js';

export function PhotoInputCard({
  photoInputState,
  photoConfirmationStatus,
  photoSession,
  photoStatus,
  selectedPhoto,
  onTakePhoto,
  onUploadFromGallery,
  onConfirmPhoto,
  onResetPhoto,
  labels = {},
}) {
  const hasSelectedPhoto = Boolean(selectedPhoto);
  const isConfirmed = photoInputState === 'confirmed';
  const isConfirming = photoConfirmationStatus === 'loading';
  const accent =
    photoInputState === 'confirmed'
      ? 'mint'
      : photoInputState === 'confirming'
        ? 'sky'
        : photoInputState === 'selected'
          ? 'rose'
          : 'default';
  const sourceLabel =
    selectedPhoto?.sourceType === 'camera'
      ? labels.sourceCamera || 'Take Photo'
      : labels.sourceGallery || 'Upload from Gallery';

  return (
    <Card accent={accent}>
      <Text style={styles.cardTitle}>{labels.cardTitle || 'Photo input'}</Text>
      <Text style={styles.bodyText}>
        {labels.body ||
          'Pick a local photo source first. Permissions are only requested when you tap a button, and the selected image stays on-device for now.'}
      </Text>
      {photoStatus ? (
        <StatusNotice
          tone={photoStatus.tone}
          title={photoStatus.title}
          message={photoStatus.message}
        />
      ) : null}

      {!hasSelectedPhoto ? (
        <View style={styles.buttonStack}>
          <PrimaryButton
            label={labels.takePhoto || 'Take Photo'}
            onPress={onTakePhoto}
            disabled={isConfirming}
          />
          <PrimaryButton
            label={labels.uploadFromGallery || 'Upload from Gallery'}
            onPress={onUploadFromGallery}
            variant="secondary"
            disabled={isConfirming}
          />
        </View>
      ) : (
        <View style={styles.selectionBlock}>
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewTitle}>
              {isConfirmed
                ? labels.confirmedTitle || 'Confirmed local photo'
                : labels.selectedTitle || 'Local photo selected'}
            </Text>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} />
            <Text style={styles.previewMeta}>{labels.sourceLabel || 'Source'}: {sourceLabel}</Text>
            <Text style={styles.previewMeta}>
              {labels.sizeLabel || 'Size'}: {selectedPhoto.width} x {selectedPhoto.height}
            </Text>
            {photoSession ? (
              <>
                <Text style={styles.previewMeta}>
                  {labels.photoSessionLabel || 'Photo session'}: {photoSession.photoSessionId}
                </Text>
                <Text style={styles.previewMeta}>
                  {labels.expiresAtLabel || 'Expires at'}: {photoSession.expiresAt}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.buttonStack}>
            {!isConfirmed ? (
              <PrimaryButton
                label={
                  isConfirming
                    ? labels.confirmingPhoto || 'Confirming Photo...'
                    : labels.confirmPhoto || 'Confirm Photo'
                }
                onPress={onConfirmPhoto}
                disabled={isConfirming}
              />
            ) : (
              <PrimaryButton
                label={labels.photoConfirmed || 'Photo Confirmed'}
                onPress={() => {}}
                disabled
              />
            )}
            <PrimaryButton
              label={
                isConfirmed
                  ? labels.retakeOrChangePhoto || 'Retake / Change Photo'
                  : labels.changePhoto || 'Change Photo'
              }
              onPress={onResetPhoto}
              variant="secondary"
              disabled={isConfirming}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  buttonStack: {
    gap: 10,
  },
  selectionBlock: {
    gap: 12,
  },
  previewPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eadac3',
    backgroundColor: '#f8f3eb',
    padding: 16,
    gap: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#eadac3',
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102a22',
  },
  previewMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7a6652',
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#42564d',
  },
});
