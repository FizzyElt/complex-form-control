import { useState } from 'react';
import { VStack, Input, Box, Button, HStack, Text, Flex, Spacer, useToast } from '@chakra-ui/react';
import { useForm, useFormContext, useFieldArray, Controller, FormProvider } from 'react-hook-form';

import isEmpty from 'ramda/es/isEmpty';
import equals from 'ramda/es/equals';
import gt from 'ramda/es/gt';
import gte from 'ramda/es/gte';
import lte from 'ramda/es/lte';
import evolve from 'ramda/es/evolve';
import pipe from 'ramda/es/pipe';
import toPairs from 'ramda/es/toPairs';
import fromPairs from 'ramda/es/fromPairs';
import map from 'ramda/es/map';

// 720 -> 12:00
function formatMinuteNumber(minutes) {
  const hours = Math.floor(minutes / 60);
  const minutesRemainder = minutes % 60;

  const minutesString = minutesRemainder < 10 ? '0' + minutesRemainder : minutesRemainder;
  const hoursString = hours < 10 ? '0' + hours : hours;

  return `${hoursString}:${minutesString}`;
}

// 12:00 -> 720
function parseTimeString(timeString = '00:00') {
  const [hours, minutes] = timeString.split(':');

  return parseInt(hours) * 60 + parseInt(minutes);
}

const transformSchedules = map(evolve({ start: parseTimeString, end: parseTimeString }));

const transformWeekSchedulesData = pipe(
  toPairs,
  map(([weekDay, schedule]) => [weekDay, transformSchedules(schedule)]),
  fromPairs
);

export default function ScheduleForm() {
  const toast = useToast({ position: 'top', duration: 2000 });
  const methods = useForm({
    defaultValues: {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    },
  });
  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text>Monday</Text>
          <WeekDaySchedules name="Monday" />
        </Box>
        <Box>
          <Text>Tuesday</Text>
          <WeekDaySchedules name="Tuesday" />
        </Box>
        <Box>
          <Text>Wednesday</Text>
          <WeekDaySchedules name="Wednesday" />
        </Box>
        <Box>
          <Text>Thursday</Text>
          <WeekDaySchedules name="Thursday" />
        </Box>
        <Box>
          <Text>Friday</Text>
          <WeekDaySchedules name="Friday" />
        </Box>
        <Box>
          <Text>Saturday</Text>
          <WeekDaySchedules name="Saturday" />
        </Box>
        <Box>
          <Text>Sunday</Text>
          <WeekDaySchedules name="Sunday" />
        </Box>
        <Button
          colorScheme="blue"
          onClick={handleSubmit((data) => {
            console.log(transformWeekSchedulesData(data));
            toast({ status: 'success', title: 'Success!!' });
          })}
        >
          submit
        </Button>
      </VStack>
    </FormProvider>
  );
}

function WeekDaySchedules({ name = '' }) {
  const { control, getValues, trigger } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  // 檢查時間重疊
  const handleCheckTimeOverlap = (startTime, endTime, index) => {
    if (isEmpty(startTime) || isEmpty(endTime)) return false;

    // convert to minutes
    const startNum = parseTimeString(startTime);
    const endNum = parseTimeString(endTime);

    if (startNum > endNum) return false;

    const schedulesOfWeekDay = getValues(name);

    if (equals(schedulesOfWeekDay.length, 1)) return true;

    // invalid case
    // |-------|   or   |-------| or |-------| or  |----|
    //   |-------|    |-------|       |----|      |------|
    const timeOverlap = schedulesOfWeekDay.some((schedule, i) => {
      if (isEmpty(schedule.start) || isEmpty(schedule.end)) return false;

      // convert to minutes
      const parsedSchedule = evolve(
        {
          start: parseTimeString,
          end: parseTimeString,
        },
        schedule
      );

      // self and invalid time will be ignored
      if (equals(i, index) || gt(parsedSchedule.start, parsedSchedule.end)) return false;

      return !(gte(startNum, parsedSchedule.end) || lte(endNum, parsedSchedule.start));
    });

    return !timeOverlap;
  };

  return (
    <VStack align="stretch">
      {fields.map((field, index) => (
        <Box key={field.id}>
          <Flex>
            <HStack>
              <Controller
                control={control}
                name={`${name}.${index}.start`}
                render={({ field, fieldState: { invalid } }) => (
                  <Input
                    w="10rem"
                    isInvalid={invalid}
                    type="time"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      trigger(name);
                    }}
                  />
                )}
                rules={{
                  required: true,
                  validate: (v) =>
                    handleCheckTimeOverlap(v, getValues(`${name}.${index}.end`), index),
                }}
              />
              <Text>-</Text>
              <Controller
                control={control}
                name={`${name}.${index}.end`}
                render={({ field, fieldState: { invalid } }) => (
                  <Input
                    w="10rem"
                    isInvalid={invalid}
                    type="time"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      trigger(name);
                    }}
                  />
                )}
                rules={{
                  required: true,
                  validate: (v) =>
                    handleCheckTimeOverlap(getValues(`${name}.${index}.start`), v, index),
                }}
              />
            </HStack>
            <Spacer />
            <Button
              colorScheme="red"
              onClick={() => {
                remove(index);
                trigger(name);
              }}
            >
              delete
            </Button>
          </Flex>
        </Box>
      ))}
      <Button w="full" onClick={() => append({ start: '00:00', end: '23:59' })}>
        add
      </Button>
    </VStack>
  );
}
